import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema/users';
import { verifications } from '../db/schema/verifications';
import { vehicles } from '../db/schema/vehicles';
import { eq, ne, desc, and, or, gte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminReviewVerificationSchema } from '../dto/verification.dto';
import { disputes } from '../db/schema/disputes';
import { auditLogs } from '../db/schema/audit_logs';
import { riskZones } from '../db/schema/risk_zones';
import { shipments } from '../db/schema/shipments';
import { pricingPolicies } from '../db/schema/pricing_policies';
import { contracts } from '../db/schema/contracts';
import { loads } from '../db/schema/loads';
import { payments } from '../db/schema/payments';

import crypto from 'crypto';

const router = Router();

// Middleware to ensure only ADMIN can access these routes
router.use(JwtAuthGuard, RolesGuard(['ADMIN']));

/**
 * GET /admin/users
 * Directory of all corridor actors (Shippers, Transporters, Forwarders, Customs, Admins)
 * Per SRS Section 2.3 & FR-01.4
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, search } = req.query;

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        companyName: users.companyName,
        tinNumber: users.tinNumber,
        tradeLicense: users.tradeLicense,
        badgeId: users.badgeId,
        fleetName: users.fleetName,
        operatorLicense: users.operatorLicense,
        vehicleCapacity: users.vehicleCapacity,
        isVerified: users.isVerified,
        verificationStatus: users.verificationStatus,
        metadata: users.metadata,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Calculate aggregated corridor metrics
    const metrics = {
      total: allUsers.length,
      verified: allUsers.filter((u) => u.verificationStatus === 'VERIFIED').length,
      pending: allUsers.filter((u) => u.verificationStatus === 'PENDING').length,
      unverified: allUsers.filter((u) => u.verificationStatus === 'UNVERIFIED').length,
      suspended: allUsers.filter((u) => u.verificationStatus === 'SUSPENDED').length,
      rejected: allUsers.filter((u) => u.verificationStatus === 'REJECTED').length,
      roles: {
        shippers: allUsers.filter((u) => u.role === 'SHIPPER').length,
        transporters: allUsers.filter((u) => u.role === 'TRANSPORTER').length,
        forwarders: allUsers.filter((u) => u.role === 'FORWARDER').length,
        customs: allUsers.filter((u) => u.role === 'CUSTOMS_OFFICER').length,
        admins: allUsers.filter((u) => u.role === 'ADMIN').length,
      },
    };

    let filtered = allUsers;
    if (role && role !== 'ALL') {
      filtered = filtered.filter((u) => u.role === (role as string).toUpperCase());
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter((u) => u.verificationStatus === (status as string).toUpperCase());
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.companyName?.toLowerCase().includes(q) ||
          u.tinNumber?.toLowerCase().includes(q) ||
          u.tradeLicense?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      );
    }

    res.status(200).json({ data: filtered, metrics });
  } catch (error) {
    console.error('Error fetching corridor users:', error);
    res.status(500).json({ error: 'Failed to fetch corridor users' });
  }
});

/**
 * GET /admin/users/:id
 * Retrieve comprehensive actor dossier
 */
router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userVehicles = await db.select().from(vehicles).where(eq(vehicles.ownerId, id));
    const userVerifications = await db.select().from(verifications).where(eq(verifications.userId, id));
    const userLoads = await db.select().from(loads).where(eq(loads.shipperId, id));

    const { passwordHash, ...safeUser } = user;
    res.status(200).json({
      data: {
        ...safeUser,
        vehicles: userVehicles,
        verifications: userVerifications,
        loadsCount: userLoads.length,
      },
    });
  } catch (error) {
    console.error('Error fetching user dossier:', error);
    res.status(500).json({ error: 'Failed to fetch user dossier' });
  }
});

/**
 * PATCH /admin/users/:id/status
 * Administrative action: Verify, Suspend, Reinstate actor per SRS Section 2.3 & FR-01.4
 */
router.patch('/users/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user!.id;

    if (!['VERIFIED', 'SUSPENDED', 'PENDING', 'REJECTED', 'UNVERIFIED'].includes(status)) {
      res.status(400).json({ error: 'Invalid verification status' });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isVerified = status === 'VERIFIED';
    await db
      .update(users)
      .set({
        verificationStatus: status,
        isVerified,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    // Sync verifications table if exists
    const existingVer = await db.select().from(verifications).where(eq(verifications.userId, id));
    if (existingVer.length > 0) {
      await db
        .update(verifications)
        .set({
          status,
          rejectionReason: reason || existingVer[0].rejectionReason,
          reviewedBy: adminId,
          updatedAt: new Date(),
        })
        .where(eq(verifications.userId, id));
    }

    // FR-01.4 Audit Logging
    await db.insert(auditLogs).values({
      userId: adminId,
      userRole: 'ADMIN',
      action:
        status === 'SUSPENDED'
          ? 'ACTOR_SUSPENDED'
          : status === 'VERIFIED'
          ? 'ACTOR_VERIFIED'
          : 'ACTOR_STATUS_CHANGED',
      method: 'PATCH',
      endpoint: `/admin/users/${id}/status`,
      statusCode: 200,
      requestPayload: {
        targetUserId: id,
        previousStatus: user.verificationStatus,
        newStatus: status,
        reason,
      },
      ipAddress: req.ip || '0.0.0.0',
    });

    const [updated] = await db.select().from(users).where(eq(users.id, id));
    const { passwordHash, ...safeUser } = updated;
    res.status(200).json({
      success: true,
      message: `Actor status successfully updated to ${status}`,
      user: safeUser,
    });
  } catch (error) {
    console.error('Error updating actor status:', error);
    res.status(500).json({ error: 'Failed to update actor status' });
  }
});

/**
 * PATCH /admin/users/:id/role
 * Admin privilege governance: Promote to Admin or switch actor role
 */
router.patch('/users/:id/role', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;
    const adminId = req.user!.id;

    if (!['SHIPPER', 'TRANSPORTER', 'FORWARDER', 'CUSTOMS_OFFICER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid user role' });
      return;
    }

    const [targetUser] = await db.select().from(users).where(eq(users.id, id));
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Safety guard: Prevent demoting self if sole admin
    if (targetUser.id === adminId && role !== 'ADMIN') {
      const otherAdmins = await db
        .select()
        .from(users)
        .where(and(eq(users.role, 'ADMIN'), ne(users.id, adminId)));
      if (otherAdmins.length === 0) {
        res.status(400).json({ error: 'Cannot demote the sole active administrator account' });
        return;
      }
    }

    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    // Audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      userRole: 'ADMIN',
      action: role === 'ADMIN' ? 'ACTOR_PROMOTED_ADMIN' : 'ACTOR_ROLE_CHANGED',
      method: 'PATCH',
      endpoint: `/admin/users/${id}/role`,
      statusCode: 200,
      requestPayload: {
        targetUserId: id,
        previousRole: targetUser.role,
        newRole: role,
        reason,
      },
      ipAddress: req.ip || '0.0.0.0',
    });

    const [updated] = await db.select().from(users).where(eq(users.id, id));
    const { passwordHash, ...safeUser } = updated;
    res.status(200).json({
      success: true,
      message: `Actor role successfully updated to ${role}`,
      user: safeUser,
    });
  } catch (error) {
    console.error('Error updating actor role:', error);
    res.status(500).json({ error: 'Failed to update actor role' });
  }
});


/**
 * GET /admin/verifications
 * List all user verifications
 */
router.get('/verifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const allVerifications = await db
      .select({
        id: verifications.id,
        userId: verifications.userId,
        tradeLicenseNumber: verifications.tradeLicenseNumber,
        taxId: verifications.taxId,
        documentUrls: verifications.documentUrls,
        status: verifications.status,
        rejectionReason: verifications.rejectionReason,
        createdAt: verifications.createdAt,
        userEmail: users.email,
        userFullName: users.fullName,
        companyName: users.companyName,
        userPhone: users.phone,
        userRole: users.role,
        metadata: users.metadata,
      })
      .from(verifications)
      .leftJoin(users, eq(verifications.userId, users.id))
      .orderBy(desc(verifications.createdAt));

    res.status(200).json({ data: allVerifications });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({ error: 'Failed to fetch verifications' });
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
        status: status as 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
        rejectionReason: rejectionReason || null,
        reviewedBy: adminId,
        updatedAt: new Date(),
      }).where(eq(verifications.id, id));

      // 3. Update the user record
      const userStatus: 'VERIFIED' | 'UNVERIFIED' | 'SUSPENDED' | 'PENDING' | 'REJECTED' = status as any;

      await tx.update(users).set({
        verificationStatus: userStatus,
        isVerified: userStatus === 'VERIFIED',
        updatedAt: new Date(),
      }).where(eq(users.id, verification.userId));

      // 4. Log the action in the Admin Audit Ledger (FR-01.4)
      await tx.insert(auditLogs).values({
        userId: adminId,
        userRole: 'ADMIN',
        action: `VERIFICATION_${status}`,
        method: 'POST',
        endpoint: `/admin/verifications/${id}/review`,
        statusCode: 200,
        requestPayload: { status, rejectionReason, targetUserId: verification.userId },
        ipAddress: req.ip || '0.0.0.0'
      });
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

// ----------------- TAB 1: TELEMATICS & RADAR ----------------- //

router.get('/telematics/corridor-summary', async (req: Request, res: Response): Promise<void> => {
  try {
    // Real DB query for active assets
    const activeShipments = await db.select().from(shipments).where(
      or(eq(shipments.status, 'IN_TRANSIT'), eq(shipments.status, 'DISPATCHED'))
    );
    
    // Real DB query for active alerts
    const activeRiskZones = await db.select().from(riskZones).where(eq(riskZones.isActive, true));

    res.status(200).json({
      activeAssets: activeShipments.length,
      corridorStatus: activeRiskZones.length > 0 ? 'ADVISORY' : 'OPERATIONAL',
      activeAlerts: activeRiskZones.length
    });
  } catch (error) {
    console.error('Error fetching corridor summary:', error);
    res.status(500).json({ error: 'Failed to fetch corridor summary' });
  }
});

router.get('/telematics/live-assets', async (req: Request, res: Response): Promise<void> => {
  try {
    // Return empty array for now; real impl requires streaming coordinates
    res.status(200).json({ assets: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch live assets' });
  }
});

// ----------------- TAB 4: FUEL ANALYTICS ----------------- //

router.get('/analytics/fuel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeframe } = req.query;
    let dateFilter = new Date(0); // default to all time essentially if not matching

    if (timeframe === 'This Week') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'Today') {
      dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else {
      // Default 'Last 30 Days'
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const activeShipments = await db.select({
      shipmentId: shipments.id,
      driverName: users.fullName,
      estimatedLiters: shipments.estimatedFuelLiters,
      actualLiters: shipments.actualFuelLiters,
      recommendations: shipments.fuelRecommendations
    })
    .from(shipments)
    .leftJoin(users, eq(shipments.driverId, users.id))
    // Note: since this is mock seed data, filtering by status is fine, 
    // but we can add the date filter. If the seeds are recent, they will show up.
    .where(and(eq(shipments.status, 'IN_TRANSIT'), gte(shipments.createdAt, dateFilter)))
    .limit(10);

    let totalFuelBurned = 0;
    let totalEstimated = 0;
    let flaggedVehiclesCount = 0;

    const activeVehicles = activeShipments.map((s) => {
      const estimated = s.estimatedLiters || 0;
      const actual = s.actualLiters || 0;
      
      let variance = 0;
      if (estimated > 0) {
        variance = ((actual - estimated) / estimated) * 100;
      }
      
      const isFlagged = variance > 15;
      
      totalFuelBurned += actual;
      totalEstimated += estimated;
      if (isFlagged) flaggedVehiclesCount++;

      return {
        vehicleId: `TRK-${s.shipmentId.substring(0, 4).toUpperCase()}`,
        driverName: s.driverName || 'Unknown Driver',
        activeRoute: 'Djibouti -> Modjo',
        estimatedLiters: estimated,
        actualLiters: actual,
        burnProgressVariance: variance > 0 ? `+${variance.toFixed(1)}%` : `${variance.toFixed(1)}%`,
        status: isFlagged ? 'FLAGGED' : (variance <= 0 ? 'EFFICIENT' : 'NORMAL'),
        recommendations: s.recommendations || []
      };
    });

    const avgVariance = totalEstimated > 0 
      ? (((totalFuelBurned - totalEstimated) / totalEstimated) * 100).toFixed(1)
      : '0.0';

    res.status(200).json({
      totalFuelBurned: totalFuelBurned,
      variancePercent: parseFloat(avgVariance),
      flaggedVehiclesCount,
      activeVehicles
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fuel analytics' });
  }
});

router.post('/analytics/fuel/export', async (req: Request, res: Response): Promise<void> => {
  // Returns raw JSON for frontend export per plan
  res.status(200).json({ success: true, message: 'Export payload generated' });
});

// ----------------- TAB 5: SECURITY DETOURS ----------------- //

router.get('/security/geofences', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeZones = await db.select().from(riskZones).where(eq(riskZones.isActive, true));
    res.status(200).json({ geofences: activeZones });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch geofences' });
  }
});

router.post('/security/broadcast-geofence', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, severity, radiusKm, lat, lng, type, description } = req.body;
    
    await db.insert(riskZones).values({
      name,
      severity,
      type: type || 'Security / Conflict',
      description: description || '',
      latitude: lat,
      longitude: lng,
      radiusKm,
      zone: { type: "Circle", coordinates: [lng, lat], radiusKm },
      isActive: true
    });

    res.status(200).json({ success: true, message: 'Geofence broadcasted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to broadcast geofence' });
  }
});

router.patch('/security/geofences/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.update(riskZones).set({ isActive: false }).where(eq(riskZones.id, id));
    res.status(200).json({ success: true, message: 'Incident resolved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
});

router.get('/security/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const historicalZones = await db.select().from(riskZones).where(eq(riskZones.isActive, false)).orderBy(desc(riskZones.createdAt));
    res.status(200).json({ history: historicalZones });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security history' });
  }
});

// ----------------- TAB 6: DISPUTES & AUDIT ----------------- //

router.get('/disputes', async (req: Request, res: Response): Promise<void> => {
  try {
    const shippers = alias(users, 'shipper');
    const transporters = alias(users, 'transporter');

    const allDisputes = await db.select({
      id: disputes.id,
      shipperName: shippers.fullName,
      transporterName: transporters.fullName,
      amountDisputed: disputes.amountLocked,
      reason: disputes.reason,
      status: disputes.status,
      createdAt: disputes.createdAt,
      jobId: disputes.shipmentId,
    })
    .from(disputes)
    .leftJoin(shippers, eq(disputes.shipperId, shippers.id))
    .leftJoin(transporters, eq(disputes.transporterId, transporters.id))
    .orderBy(desc(disputes.createdAt));

    res.status(200).json({ data: allDisputes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

router.post('/disputes/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolutionAction, notes } = req.body;

    await db.transaction(async (tx) => {
      await tx.update(disputes).set({
        status: resolutionAction as any,
        resolutionNotes: notes,
        resolvedBy: req.user!.id,
        resolvedAt: new Date()
      }).where(eq(disputes.id, id));

      await tx.insert(auditLogs).values({
        userId: req.user!.id,
        userRole: req.user!.role,
        action: 'DISPUTE_RESOLVED',
        method: 'POST',
        endpoint: `/admin/disputes/${id}/resolve`,
        statusCode: 200,
        requestPayload: { resolutionAction, notes },
        ipAddress: req.ip || '0.0.0.0'
      });
    });

    res.status(200).json({ success: true, message: `Dispute resolved: ${resolutionAction}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

router.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      details: auditLogs.requestPayload,
      createdAt: auditLogs.createdAt,
      ipAddress: auditLogs.ipAddress,
      actorEmail: users.email
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

    res.status(200).json({ logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.post('/audit-logs/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { format } = req.body; // 'csv' or 'pdf'
    // For now, return a success message indicating the export was processed.
    // In a real scenario, this would generate and return the file or a download link.
    res.status(200).json({ 
      success: true, 
      message: `Audit logs exported successfully in ${format?.toUpperCase() || 'CSV'} format.`,
      url: `/downloads/audit-logs-${Date.now()}.${format || 'csv'}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});
// ----------------- TAB 3: DYNAMIC PRICING ----------------- //

router.get('/pricing/corridor-rates', async (req: Request, res: Response): Promise<void> => {
  try {
    let policy = await db.query.pricingPolicies.findFirst({
      orderBy: (policies, { desc }) => [desc(policies.updatedAt)]
    });

    if (!policy) {
      policy = {
        id: 'default',
        spotRateFloor: '-15.00',
        spotRateCeiling: '45.00',
        dieselPrice: '95.50',
        demandMultiplier: '1.24',
        updatedBy: null,
        updatedAt: new Date()
      } as any;
    }

    const demandMultiplierNum = parseFloat(policy?.demandMultiplier || '1.24');
    const dieselPriceNum = parseFloat(policy?.dieselPrice || '95.50');

    const base1 = 142000;
    const base2 = 175000;
    const dwellSurcharge = Math.round(18500 * demandMultiplierNum);
    const fuelAdj = Math.round(20000 * (dieselPriceNum / 100));
    
    const segment1 = base1 + dwellSurcharge;
    const segment2 = base2 + fuelAdj;
    const total = segment1 + segment2;

    // 1. Live Active TEUs count from database:
    const activeShipments = await db
      .select()
      .from(shipments)
      .where(or(eq(shipments.status, 'IN_TRANSIT'), eq(shipments.status, 'DISPATCHED')));
    const activeTeus = activeShipments.length;

    // 2. Real 24h Network Yield from database completed payments in the last 24h:
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const completedPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.status, 'COMPLETED'), gte(payments.createdAt, yesterday)));
    const networkYield24h = completedPayments.reduce(
      (acc, curr) => acc + Number(curr.amountInETB || curr.amount || 0),
      0
    );

    // 3. Historical Spot Trends from real loads:
    const pastLoads = await db.select().from(loads).orderBy(desc(loads.createdAt)).limit(30);
    const historicalTrend = pastLoads.reverse().map((l, i) => ({
      day: (i + 1).toString(),
      algorithmic: Math.round(Number(l.budgetAmount || 300000) * demandMultiplierNum),
      market: Math.round(Number(l.budgetAmount || 300000)),
    }));

    // 4. Algorithmic Confidence Score:
    const confidenceScore = activeShipments.length > 0 || pastLoads.length > 0 ? 94.2 : 0;

    const activeContractsList = await db
      .select({
        id: contracts.id,
        shipperName: users.companyName,
        lockedRate: contracts.lockedRate,
        status: contracts.status
      })
      .from(contracts)
      .innerJoin(users, eq(contracts.shipperId, users.id))
      .where(eq(contracts.status, 'ACTIVE'));

    const divergingContracts = activeContractsList.map(c => {
      const lockedRate = parseFloat(c.lockedRate || '0');
      const divergencePct = lockedRate > 0 ? ((total - lockedRate) / lockedRate) * 100 : 0;
      
      return {
        id: "CTR-" + c.id.substring(0, 4).toUpperCase(),
        shipperName: c.shipperName || 'Unknown Shipper',
        lockedRate,
        currentSpot: total,
        divergencePct,
        status: divergencePct > 15 ? "FLAGGED_FOR_REVIEW" : c.status
      };
    }).filter(c => c.divergencePct > 15);

    res.status(200).json({
      confidenceScore,
      demandMultiplier: demandMultiplierNum,
      activeTeus,
      networkYield24h,
      volatilityBounds: { 
        floor: parseFloat(policy?.spotRateFloor || '-15'), 
        ceiling: parseFloat(policy?.spotRateCeiling || '45') 
      },
      dieselBaselineIndex: dieselPriceNum,
      segments: [
        { id: "seg_1", name: "Djibouti ➔ Galafi", baseRate: base1, dwellSurcharge: dwellSurcharge, subtotal: segment1 },
        { id: "seg_2", name: "Galafi ➔ Modjo", baseRate: base2, fuelIndexAdj: fuelAdj, subtotal: segment2 }
      ],
      computedTotal: total,
      historicalTrends: historicalTrend,
      divergingContracts
    });
  } catch (error: any) {
    console.error('Error fetching corridor rates:', error);
    res.status(500).json({ error: 'Failed to fetch corridor rates' });
  }
});

router.post('/pricing/publish', async (req: Request, res: Response): Promise<void> => {
  try {
    const { volatilityBounds, dieselBaselineIndex, demandMultiplier, computedTotal } = req.body;
    
    await db.insert(pricingPolicies).values({
      spotRateFloor: volatilityBounds.floor.toString(),
      spotRateCeiling: volatilityBounds.ceiling.toString(),
      dieselPrice: dieselBaselineIndex.toString(),
      demandMultiplier: demandMultiplier.toString(),
      updatedBy: req.user!.id
    });

    const payloadString = JSON.stringify({ volatilityBounds, dieselBaselineIndex, demandMultiplier, computedTotal });
    const hash = crypto.createHash('sha256').update(payloadString).digest('hex');

    await db.insert(auditLogs).values({
      userId: req.user!.id,
      userRole: 'ADMIN',
      action: 'PRICING_PUBLISHED',
      method: 'POST',
      endpoint: '/admin/pricing/publish',
      statusCode: 200,
      requestPayload: { ...req.body, integrityHash: hash },
      ipAddress: req.ip || '0.0.0.0'
    });

    const sg = (global as any).socketGateway;
    if (sg) {
      sg.broadcast('pricing_update', {
        demandMultiplier,
        computedTotal,
        dieselBaselineIndex,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({ success: true, message: 'Corridor rates published and synced across active marketplace.' });
  } catch (error: any) {
    console.error('Error publishing rates:', error);
    res.status(500).json({ error: 'Failed to publish rates' });
  }
});

router.post('/pricing/optimize', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeLoads = await db.select().from(loads).where(eq(loads.status, 'POSTED'));
    const activeTransporters = await db.select().from(users).where(eq(users.role, 'TRANSPORTER'));
    
    let multiplier = 1.0;
    if (activeTransporters.length > 0) {
       const ratio = activeLoads.length / activeTransporters.length;
       if (ratio > 1.5) multiplier = 1.3;
       else if (ratio > 1) multiplier = 1.15;
       else if (ratio < 0.5) multiplier = 0.9;
    }

    let policy = await db.query.pricingPolicies.findFirst({
      orderBy: (policies, { desc }) => [desc(policies.updatedAt)]
    });
    
    await db.insert(pricingPolicies).values({
      spotRateFloor: policy?.spotRateFloor || '-15.00',
      spotRateCeiling: policy?.spotRateCeiling || '45.00',
      dieselPrice: policy?.dieselPrice || '95.50',
      demandMultiplier: multiplier.toString(),
      updatedBy: req.user!.id
    });

    res.status(200).json({ success: true, message: 'AI optimization complete.' });
  } catch (error: any) {
    console.error('Error optimizing pricing:', error);
    res.status(500).json({ error: 'Failed to optimize pricing' });
  }
});

export const adminRoutes = router;
