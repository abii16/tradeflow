import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema/users';
import { verifications } from '../db/schema/verifications';
import { vehicles } from '../db/schema/vehicles';
import { eq } from 'drizzle-orm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubmitVerificationSchema } from '../dto/verification.dto';

const router = Router();

/**
 * POST /verification/submit - Submit verification documents
 * Requires: Authentication (UNVERIFIED or PENDING state usually)
 */
router.post('/submit', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const parsed = SubmitVerificationSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
      return;
    }
    
    const data = parsed.data;

    await db.transaction(async (tx) => {
      // 1. Create or update verifications record
      const existingVerification = await tx.select().from(verifications).where(eq(verifications.userId, userId));
      if (existingVerification.length > 0) {
        await tx.update(verifications).set({
          tradeLicenseNumber: data.tradeLicenseNumber,
          taxId: data.taxId,
          documentUrls: data.documentUrls ?? null,
          status: 'PENDING', // Reset to pending if resubmitting
          updatedAt: new Date(),
        }).where(eq(verifications.userId, userId));
      } else {
        await tx.insert(verifications).values({
          userId,
          tradeLicenseNumber: data.tradeLicenseNumber,
          taxId: data.taxId,
          documentUrls: data.documentUrls ?? null,
          status: 'PENDING',
        });
      }

      // 2. If Transporter and provided vehicle info, insert/update vehicle
      if (req.user!.role === 'TRANSPORTER' && data.vehicleType && data.capacityTons) {
        const existingVehicle = await tx.select().from(vehicles).where(eq(vehicles.ownerId, userId));
        if (existingVehicle.length > 0) {
          await tx.update(vehicles).set({
            vehicleType: data.vehicleType,
            capacityTons: data.capacityTons.toString(),
            fuelType: data.fuelType ?? null,
            insuranceDocUrl: data.insuranceDocUrl ?? null,
            roadworthinessDocUrl: data.roadworthinessDocUrl ?? null,
            isVerified: false,
            updatedAt: new Date(),
          }).where(eq(vehicles.ownerId, userId));
        } else {
          await tx.insert(vehicles).values({
            ownerId: userId,
            vehicleType: data.vehicleType,
            capacityTons: data.capacityTons.toString(),
            fuelType: data.fuelType ?? null,
            insuranceDocUrl: data.insuranceDocUrl ?? null,
            roadworthinessDocUrl: data.roadworthinessDocUrl ?? null,
            isVerified: false,
          });
        }
      }

      // 3. Update user status to PENDING
      await tx.update(users).set({
        verificationStatus: 'PENDING',
        updatedAt: new Date(),
      }).where(eq(users.id, userId));
    });

    res.status(200).json({ message: 'Verification details submitted successfully' });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ error: 'Failed to submit verification details' });
  }
});

/**
 * GET /verification/status - Check verification status
 * Requires: Authentication
 */
router.get('/status', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const [verificationRecord] = await db.select().from(verifications).where(eq(verifications.userId, userId));
    const [userRecord] = await db.select({ status: users.verificationStatus }).from(users).where(eq(users.id, userId));
    
    res.status(200).json({
      status: userRecord?.status || 'UNVERIFIED',
      verificationDetails: verificationRecord || null,
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
});

export const verificationRoutes = router;
