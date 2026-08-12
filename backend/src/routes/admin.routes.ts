import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema/users';
import { verifications } from '../db/schema/verifications';
import { eq, desc, and } from 'drizzle-orm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminReviewVerificationSchema } from '../dto/verification.dto';

const router = Router();

// Middleware to ensure only SYSTEM_ADMIN can access these routes
router.use(JwtAuthGuard, RolesGuard(['SYSTEM_ADMIN']));

/**
 * GET /admin/verifications/pending
 * List all pending user verifications
 */
router.get('/verifications/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingVerifications = await db
      .select({
        id: verifications.id,
        userId: verifications.userId,
        tradeLicenseNumber: verifications.tradeLicenseNumber,
        taxId: verifications.taxId,
        documentUrls: verifications.documentUrls,
        status: verifications.status,
        createdAt: verifications.createdAt,
        userEmail: users.email,
        userFullName: users.fullName,
        userRole: users.role,
      })
      .from(verifications)
      .leftJoin(users, eq(verifications.userId, users.id))
      .where(eq(verifications.status, 'PENDING'))
      .orderBy(desc(verifications.createdAt));

    res.status(200).json({ data: pendingVerifications });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
});

/**
 * POST /admin/verifications/:id/review
 * Approve, reject, or suspend a user verification request
 */
router.post('/verifications/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    const parsed = AdminReviewVerificationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
      return;
    }

    const { status, rejectionReason } = parsed.data;

    await db.transaction(async (tx) => {
      // 1. Get verification record
      const [verification] = await tx.select().from(verifications).where(eq(verifications.id, id));
      if (!verification) {
        throw new Error('Verification record not found');
      }

      // 2. Update verification record
      await tx.update(verifications).set({
        status: status as 'VERIFIED' | 'SUSPENDED', // 'REJECTED' maps to 'UNVERIFIED' in users table or we can keep it as 'REJECTED' here and 'UNVERIFIED' in users
        rejectionReason: rejectionReason || null,
        reviewedBy: adminId,
        updatedAt: new Date(),
      }).where(eq(verifications.id, id));

      // 3. Update the user record
      // If admin rejects, we set the user back to UNVERIFIED so they can resubmit
      let userStatus: 'VERIFIED' | 'UNVERIFIED' | 'SUSPENDED' | 'PENDING' = status as any;
      if (status === 'REJECTED') {
        userStatus = 'UNVERIFIED';
      }

      await tx.update(users).set({
        verificationStatus: userStatus,
        isVerified: userStatus === 'VERIFIED', // Maintain backwards compatibility
        updatedAt: new Date(),
      }).where(eq(users.id, verification.userId));
    });

    res.status(200).json({ message: `Verification successfully updated to ${status}` });
  } catch (error: any) {
    console.error('Error reviewing verification:', error);
    if (error.message === 'Verification record not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to review verification' });
  }
});

export const adminRoutes = router;
