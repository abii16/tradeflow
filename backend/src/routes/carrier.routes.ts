import { Router, Request, Response } from 'express';
import { db } from '../db';
import { loads } from '../db/schema/loads';
import { bids } from '../db/schema/bids';
import { shipments } from '../db/schema/shipments';
import { users } from '../db/schema/users';
import { payments } from '../db/schema/payments';
import { vehicles } from '../db/schema/vehicles';
import { incidents } from '../db/schema/incidents';
import { telemetryLogs } from '../db/schema/telemetry_logs';
import { riskZones } from '../db/schema/risk_zones';
import { eq, desc, and, or, sql, ne } from 'drizzle-orm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { auditMiddleware } from '../middleware/audit.middleware';
import { payoutService } from '../modules/payments';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const router = Router();

// Middleware: Carrier portal is accessible by TRANSPORTER, DRIVER, and ADMIN
router.use(JwtAuthGuard, RolesGuard(['TRANSPORTER', 'DRIVER', 'ADMIN', 'SYSTEM_ADMIN']));

/**
 * GET /api/v1/carrier/overview
 * Transporter top-level operational metrics strictly computed from real DB records
 */
router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 1. Count active hauls (DISPATCHED, PICKED_UP, IN_TRANSIT, IN_CUSTOMS)
    const activeShipments = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.transporterId, userId),
          ne(shipments.status, 'DELIVERED')
        )
      );

    // 2. Count delivered hauls
    const completedShipments = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.transporterId, userId),
          eq(shipments.status, 'DELIVERED')
        )
      );

    // 3. Count active pending bids
    const pendingBids = await db
      .select()
      .from(bids)
      .where(
        and(
          eq(bids.transporterId, userId),
          eq(bids.status, 'PENDING')
        )
      );

    // 4. Count fleet vehicles
    const fleetVehicles = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.ownerId, userId));

    // 5. Total earned from payments (payeeId = userId)
    const earnedPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.payeeId, userId));

    let totalEarningsETB = 0;
    let pendingEscrowETB = 0;
    for (const p of earnedPayments) {
      const net = Number(p.netPayoutAmount || p.amountInETB || p.amount || 0);
      if (p.status === 'COMPLETED' || p.payoutStatus === 'COMPLETED') {
        totalEarningsETB += net;
      } else if (p.status === 'ESCROW_HELD' || p.payoutStatus === 'SCHEDULED') {
        pendingEscrowETB += net;
      }
    }

    // 6. Latest active shipment with detailed load & driver info
    let latestActiveShipment = null;
    if (activeShipments.length > 0) {
      const s = activeShipments[0];
      const [load] = await db.select().from(loads).where(eq(loads.id, s.loadId));
      const [driver] = await db.select().from(users).where(eq(users.id, s.driverId));
      latestActiveShipment = {
        ...s,
        loadTitle: load?.title || 'Active Corridor Haul',
        origin: load?.origin,
        destination: load?.destination,
        cargoType: load?.cargoType,
        weightKg: load?.weightKg,
        driverName: driver?.fullName || 'Assigned Driver',
        driverPhone: driver?.phone || '+251911000000',
      };
    }

    res.status(200).json({
      activeHaulsCount: activeShipments.length,
      completedHaulsCount: completedShipments.length,
      pendingBidsCount: pendingBids.length,
      fleetCount: fleetVehicles.length,
      totalEarningsETB,
      pendingEscrowETB,
      verificationStatus: req.user!.verificationStatus || (req.user!.isVerified ? 'VERIFIED' : 'PENDING'),
      latestActiveShipment,
    });
  } catch (error: any) {
    console.error('[Carrier Route] Error getting overview:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch carrier overview' });
  }
});

export const carrierRoutes = router;
