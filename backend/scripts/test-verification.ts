import { db, queryClient } from '../src/db';
import { users } from '../src/db/schema/users';
import { verifications } from '../src/db/schema/verifications';
import { eq } from 'drizzle-orm';

async function seedTestVerification() {
  try {
    console.log('Inserting dummy user...');
    
    // Create a dummy user
    const [user] = await db.insert(users).values({
      email: `test_shipper_${Date.now()}@example.com`,
      fullName: 'Ethio-Djibouti Carriers',
      phone: '+251911000000',
      role: 'SHIPPER',
      companyName: 'Test Shipper PLC',
      verificationStatus: 'PENDING'
    }).returning();

    console.log('Created user with ID:', user.id);

    // Create a pending verification
    await db.insert(verifications).values({
      userId: user.id,
      tradeLicenseNumber: 'TRD-TEST-9999',
      taxId: 'TIN-ET-TEST1',
      status: 'PENDING'
    });

    console.log('Successfully inserted pending verification!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestVerification();
