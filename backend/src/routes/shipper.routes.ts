import { Router, Request, Response } from 'express';
import { db } from '../db';
import { loads } from '../db/schema/loads';
import { bids } from '../db/schema/bids';
import { shipments } from '../db/schema/shipments';
import { contracts } from '../db/schema/contracts';
import { users } from '../db/schema/users';
import { payments } from '../db/schema/payments';
import { eq, desc, and, or } from 'drizzle-orm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();

// Middleware to ensure only SHIPPER can access these routes
router.use(JwtAuthGuard, RolesGuard(['SHIPPER']));

// ==========================================
// TAB 1: OPERATIONS / ACTIVE SHIPMENT
// ==========================================

router.get('/shipments/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeShipments = await db.select({ shipment: shipments }).from(shipments)
      .innerJoin(loads, eq(shipments.loadId, loads.id))
      .where(and(eq(loads.shipperId, req.user!.id), eq(shipments.status, 'IN_TRANSIT')))
      .orderBy(desc(shipments.createdAt))
      .limit(1);

    if (activeShipments.length === 0) {
       res.status(200).json({ shipment: null });
       return;
    }

    res.status(200).json({ shipment: activeShipments[0].shipment });
  } catch (error) {
    console.error('Error fetching active shipment:', error);
    res.status(500).json({ error: 'Failed to fetch active shipment' });
  }
});

// ==========================================
// TAB 2: MY LOADS & BIDS EXCHANGE
// ==========================================

router.get('/loads', async (req: Request, res: Response): Promise<void> => {
  try {
    const allLoads = await db.select().from(loads)
      .where(eq(loads.shipperId, req.user!.id))
      .orderBy(desc(loads.createdAt));

    // For each load, fetch active incoming bids with transporter info
    const loadsWithBids = await Promise.all(allLoads.map(async (load) => {
      const rawBids = await db.select({
        id: bids.id,
        amount: bids.bidAmount,
        currency: bids.currency,
        status: bids.status,
        createdAt: bids.createdAt,
        transporterId: users.id,
        transporterName: users.fullName,
      })
      .from(bids)
      .leftJoin(users, eq(bids.transporterId, users.id))
      .where(eq(bids.loadId, load.id));

      const formattedBids = rawBids.map(b => ({
        ...b,
        transporterRating: '4.8',
        proximity: '2h away'
      }));

      return { ...load, bids: formattedBids };
    }));

    res.status(200).json({ loads: loadsWithBids });
  } catch (error) {
    console.error('Error fetching shipper loads:', error);
    res.status(500).json({ error: 'Failed to fetch loads' });
  }
});

router.post('/bids/:bidId/accept-escrow', auditMiddleware('SHIPPER_ACCEPT_BID'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { bidId } = req.params;
    const shipperId = req.user!.id;

    await db.transaction(async (tx) => {
      // 1. Get bid and load
      const [bid] = await tx.select().from(bids).where(eq(bids.id, bidId));
      if (!bid) throw new Error('Bid not found');
      
      const [load] = await tx.select().from(loads).where(eq(loads.id, bid.loadId));
      if (!load) throw new Error('Load not found');
      
      if (load.shipperId !== shipperId) throw new Error('Unauthorized');

      // 2. Accept bid
      await tx.update(bids).set({ status: 'ACCEPTED', updatedAt: new Date() }).where(eq(bids.id, bidId));
      await tx.update(bids).set({ status: 'REJECTED', updatedAt: new Date() }).where(and(eq(bids.loadId, load.id), eq(bids.status, 'PENDING')));
      
      // 3. Update load status
      await tx.update(loads).set({ status: 'MATCHED', updatedAt: new Date() }).where(eq(loads.id, load.id));

      const [newShipment] = await tx.insert(shipments).values({
        loadId: load.id,
        acceptedBidId: bid.id,
        transporterId: bid.transporterId,
        driverId: bid.transporterId, // Typically assigned later, default to transporter for now
        status: 'DISPATCHED'
      }).returning({ id: shipments.id });

      // 5. Escrow Payment Record
      await tx.insert(payments).values({
        shipmentId: newShipment.id,
        payerId: shipperId,
        payeeId: bid.transporterId,
        amount: bid.bidAmount,
        currency: bid.currency,
        amountInETB: bid.bidAmount,
        status: 'ESCROW_HELD',
        paymentMethod: 'TELEBIRR',
        outTradeNo: `TB-ESCROW-${Math.floor(Math.random() * 1000000)}`,
        idempotencyKey: `IDEM-${Date.now()}-${bid.id}`,
      });
    });

    res.status(200).json({ success: true, message: 'Bid accepted and locked into escrow' });
  } catch (error: any) {
    console.error('Error accepting bid:', error);
    res.status(400).json({ error: error.message || 'Failed to accept bid' });
  }
});

// ==========================================
// TAB 3: CONTRACT RATES MANAGEMENT
// ==========================================

router.get('/contract-rates', async (req: Request, res: Response): Promise<void> => {
  try {
    const allContracts = await db.select({
      id: contracts.id,
      origin: contracts.origin,
      destination: contracts.destination,
      lockedRate: contracts.lockedRate,
      status: contracts.status,
      validUntil: contracts.validUntil,
      transporterName: users.fullName,
      companyName: users.companyName
    })
    .from(contracts)
    .leftJoin(users, eq(contracts.transporterId, users.id))
    .where(eq(contracts.shipperId, req.user!.id));

    res.status(200).json({ contracts: allContracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

router.post('/contract-rates', auditMiddleware('SHIPPER_CREATE_CONTRACT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { transporterId, origin, destination, lockedRate, validUntil } = req.body;
    
    await db.insert(contracts).values({
      shipperId: req.user!.id,
      transporterId,
      origin,
      destination,
      lockedRate: lockedRate.toString(),
      validUntil: new Date(validUntil),
      status: 'ACTIVE'
    });

    res.status(201).json({ success: true, message: 'Contract created successfully' });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

router.post('/contract-rates/:id/renegotiate', auditMiddleware('SHIPPER_RENEGOTIATE_CONTRACT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await db.update(contracts)
      .set({ status: 'REVIEW_REQUIRED', updatedAt: new Date() })
      .where(and(eq(contracts.id, id), eq(contracts.shipperId, req.user!.id)));

    res.status(200).json({ success: true, message: 'Renegotiation initiated' });
  } catch (error) {
    console.error('Error renegotiating contract:', error);
    res.status(500).json({ error: 'Failed to renegotiate contract' });
  }
});

// ==========================================
// TAB 5: ORGANIZATION SETTINGS
// ==========================================

router.get('/organization', async (req: Request, res: Response): Promise<void> => {
  try {
    const [user] = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      companyName: users.companyName,
      tinNumber: users.tinNumber,
      tradeLicense: users.tradeLicense
    })
    .from(users)
    .where(eq(users.id, req.user!.id));

    res.status(200).json({ organization: user });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization details' });
  }
});

router.put('/organization', auditMiddleware('SHIPPER_UPDATE_ORG'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, phone, tinNumber, tradeLicense } = req.body;
    
    await db.update(users).set({
      companyName,
      phone,
      tinNumber,
      tradeLicense,
      updatedAt: new Date()
    }).where(eq(users.id, req.user!.id));

    res.status(200).json({ success: true, message: 'Organization updated successfully' });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization details' });
  }
});

export const shipperRoutes = router;
