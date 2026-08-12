import { db } from '../src/db';
import { users } from '../src/db/schema/users';
import { verifications } from '../src/db/schema/verifications';
import { vehicles } from '../src/db/schema/vehicles';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import express from 'express';
// Mock guards before importing routes
jest.mock('../src/auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: (req: any, res: any, next: any) => next(),
}));
jest.mock('../src/auth/guards/roles.guard', () => ({
  RolesGuard: () => (req: any, res: any, next: any) => next(),
}));

import { verificationRoutes } from '../src/routes/verification.routes';
import { adminRoutes } from '../src/routes/admin.routes';

const app = express();
app.use(express.json());

// Mock auth middleware for testing
app.use((req, res, next) => {
  const role = req.headers['x-mock-role'] as any;
  const id = req.headers['x-mock-id'] as string;
  if (id && role) {
    req.user = { 
      id, 
      role, 
      email: 'test@test.com', 
      isVerified: false, 
      fullName: 'Test User', 
      createdAt: new Date() 
    } as any;
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.use('/verification', verificationRoutes);
app.use('/admin', adminRoutes);

describe('Verification Queue APIs', () => {
  let shipperId: string;
  let adminId: string;

  beforeAll(async () => {
    // Insert mock users
    const [shipper] = await db.insert(users).values({
      email: 'shipper_verify_test@test.com',
      fullName: 'Test Shipper',
      phone: '0911000001',
      role: 'SHIPPER',
    }).returning();
    shipperId = shipper.id;

    const [admin] = await db.insert(users).values({
      email: 'admin_verify_test@test.com',
      fullName: 'System Admin',
      phone: '0911000002',
      role: 'SYSTEM_ADMIN',
    }).returning();
    adminId = admin.id;
  });

  afterAll(async () => {
    // Clean up
    await db.delete(users).where(eq(users.id, shipperId));
    await db.delete(users).where(eq(users.id, adminId));
  });

  it('should allow user to submit verification details', async () => {
    const res = await request(app)
      .post('/verification/submit')
      .set('x-mock-id', shipperId)
      .set('x-mock-role', 'SHIPPER')
      .send({
        tradeLicenseNumber: 'TRD-1234',
        taxId: 'TAX-5678',
        documentUrls: { tradeLicense: 'url1', idCard: 'url2' }
      });
    
    expect(res.status).toBe(200);
    
    // Check DB
    const [user] = await db.select().from(users).where(eq(users.id, shipperId));
    expect(user.verificationStatus).toBe('PENDING');

    const [verification] = await db.select().from(verifications).where(eq(verifications.userId, shipperId));
    expect(verification).toBeDefined();
    expect(verification.status).toBe('PENDING');
  });

  it('should allow admin to see pending verifications', async () => {
    const res = await request(app)
      .get('/admin/verifications/pending')
      .set('x-mock-id', adminId)
      .set('x-mock-role', 'SYSTEM_ADMIN');
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].tradeLicenseNumber).toBe('TRD-1234');
  });

  it('should allow admin to approve a verification', async () => {
    // Get the verification ID
    const [verification] = await db.select().from(verifications).where(eq(verifications.userId, shipperId));

    const res = await request(app)
      .post(`/admin/verifications/${verification.id}/review`)
      .set('x-mock-id', adminId)
      .set('x-mock-role', 'SYSTEM_ADMIN')
      .send({ status: 'VERIFIED' });
    
    expect(res.status).toBe(200);

    // Check DB
    const [user] = await db.select().from(users).where(eq(users.id, shipperId));
    expect(user.verificationStatus).toBe('VERIFIED');
    expect(user.isVerified).toBe(true);

    const [updatedVerification] = await db.select().from(verifications).where(eq(verifications.id, verification.id));
    expect(updatedVerification.status).toBe('VERIFIED');
    expect(updatedVerification.reviewedBy).toBe(adminId);
  });
});
