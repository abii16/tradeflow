import { Router, Request, Response } from 'express';
import { db } from '../db';
import { bids } from '../db/schema/bids';
import { loads } from '../db/schema/loads';
import { shipments } from '../db/schema/shipments';
import { eq, and, ne, desc } from 'drizzle-orm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { VerificationGuard } from '../auth/guards/verification.guard';
import { CreateBidSchema, AcceptBidSchema, QueryBidsSchema } from '../dto/bids.dto';

const router = Router();

// Helper to execute acceptance logic with pessimistic concurrency locks
async function executeAcceptBid(bidId: string, driverId: string | undefined, user: NonNullable<Request['user']>) {
  return await db.transaction(async (tx) => {
    // 1. Lock the bid row with FOR UPDATE
    const [bid] = await tx.select().from(bids)
      .where(eq(bids.id, bidId))
      .for('update');

    if (!bid) {
      return { errorStatus: 404, errorMessage: 'Bid not found' };
    }

    if (bid.status !== 'PENDING') {
      return { errorStatus: 400, errorMessage: `Cannot accept bid with status '${bid.status}'` };
    }

    // 2. Lock the associated load row with FOR UPDATE
    const [load] = await tx.select().from(loads)
      .where(eq(loads.id, bid.loadId))
      .for('update');

    if (!load) {
      return { errorStatus: 404, errorMessage: 'Associated load not found' };
    }

    // Check load ownership (must be the shipper who posted it or SYSTEM_ADMIN)
    if (user.role !== 'SYSTEM_ADMIN' && load.shipperId !== user.id) {
      return { errorStatus: 403, errorMessage: 'Forbidden: You do not own the load for this bid' };
    }

    // Check load status - prevent double acceptance / race condition
    if (load.status !== 'POSTED') {
      return { errorStatus: 409, errorMessage: `Load is no longer available for bidding (current status: ${load.status})` };
    }

    // 3. Atomically update winning bid status to ACCEPTED
    const [acceptedBid] = await tx.update(bids)
      .set({
        status: 'ACCEPTED',
        updatedAt: new Date(),
      })
      .where(eq(bids.id, bid.id))
      .returning();

    // 4. Reject all other competing pending bids on this load
    await tx.update(bids)
      .set({
        status: 'REJECTED',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bids.loadId, load.id),
          ne(bids.id, bid.id),
          eq(bids.status, 'PENDING')
        )
      );

    // 5. Update load status to MATCHED
    const [updatedLoad] = await tx.update(loads)
      .set({
        status: 'MATCHED',
        updatedAt: new Date(),
      })
      .where(eq(loads.id, load.id))
      .returning();

    // 6. Create shipment record linking load, accepted bid, and transporter
    const assignedDriverId = driverId || bid.transporterId;
    const [newShipment] = await tx.insert(shipments)
      .values({
        loadId: load.id,
        acceptedBidId: bid.id,
        transporterId: bid.transporterId,
        driverId: assignedDriverId,
        status: 'DISPATCHED',
      })
      .returning();

    return {
      acceptedBid,
      load: updatedLoad,
      shipment: newShipment,
    };
  });
}

/**
 * POST /bids - Create a new bid on an active load
 * Requires: Authentication, Roles: TRANSPORTER | SYSTEM_ADMIN, Verified Account
 */
router.post('/', JwtAuthGuard, RolesGuard(['TRANSPORTER', 'SYSTEM_ADMIN']), VerificationGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = CreateBidSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
      return;
    }

    const data = parsed.data;

    // Check load existence and status
    const [load] = await db.select().from(loads).where(eq(loads.id, data.loadId));
    if (!load) {
      res.status(404).json({ error: 'Load not found' });
      return;
    }

    if (load.status !== 'POSTED') {
      res.status(400).json({ error: `Cannot bid on a load with status '${load.status}'` });
      return;
    }

    if (load.expiresAt && new Date(load.expiresAt) <= new Date()) {
      res.status(400).json({ error: 'Load has expired' });
      return;
    }

    if (load.shipperId === req.user!.id) {
      res.status(400).json({ error: 'Cannot bid on your own load' });
      return;
    }

    const [newBid] = await db.insert(bids).values({
      loadId: data.loadId,
      transporterId: req.user!.id,
      bidAmount: data.bidAmount.toString(),
      currency: data.currency,
      deliveryEta: data.deliveryEta ? new Date(data.deliveryEta) : undefined,
      notes: data.notes,
      status: 'PENDING',
    }).returning();

    res.status(201).json({ message: 'Bid submitted successfully', bid: newBid });
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

/**
 * POST /bids/accept - Accept a bid (via body { bidId, driverId? })
 * Requires: Authentication, Roles: SHIPPER | SYSTEM_ADMIN
 */
router.post('/accept', JwtAuthGuard, RolesGuard(['SHIPPER', 'SYSTEM_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = AcceptBidSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.bidId) {
      res.status(400).json({
        error: 'Invalid input',
        details: parsed.success ? 'bidId is required in request body' : parsed.error.errors,
      });
      return;
    }

    const result = await executeAcceptBid(parsed.data.bidId, parsed.data.driverId, req.user!);
    if ('errorStatus' in result && result.errorStatus) {
      res.status(result.errorStatus).json({ error: result.errorMessage });
      return;
    }

    res.status(200).json({
      message: 'Bid accepted successfully and shipment dispatched',
      bid: result.acceptedBid,
      load: result.load,
      shipment: result.shipment,
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ error: 'Failed to accept bid' });
  }
});

/**
 * POST /bids/:id/accept - Accept a specific bid by route param ID
 * Requires: Authentication, Roles: SHIPPER | SYSTEM_ADMIN
 */
router.post('/:id/accept', JwtAuthGuard, RolesGuard(['SHIPPER', 'SYSTEM_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = AcceptBidSchema.safeParse(req.body);
    const driverId = parsed.success ? parsed.data.driverId : undefined;

    const result = await executeAcceptBid(id, driverId, req.user!);
    if ('errorStatus' in result && result.errorStatus) {
      res.status(result.errorStatus).json({ error: result.errorMessage });
      return;
    }

    res.status(200).json({
      message: 'Bid accepted successfully and shipment dispatched',
      bid: result.acceptedBid,
      load: result.load,
      shipment: result.shipment,
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ error: 'Failed to accept bid' });
  }
});

/**
 * GET /bids - List bids with optional filtering & pagination
 * Requires: Authentication
 */
router.get('/', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = QueryBidsSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.errors });
      return;
    }

    const { loadId, transporterId, status, limit, offset } = parsed.data;
    const conditions = [];

    if (loadId) conditions.push(eq(bids.loadId, loadId));
    if (status) conditions.push(eq(bids.status, status));

    // Role-based visibility enforcement
    if (req.user!.role === 'TRANSPORTER') {
      // Transporters only see their own bids
      conditions.push(eq(bids.transporterId, req.user!.id));
    } else if (transporterId) {
      conditions.push(eq(bids.transporterId, transporterId));
    }

    const results = await db.select().from(bids)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(bids.createdAt));

    res.json({ bids: results });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

/**
 * GET /bids/:id - Get a single bid by ID
 * Requires: Authentication
 */
router.get('/:id', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [bid] = await db.select().from(bids).where(eq(bids.id, id));

    if (!bid) {
      res.status(404).json({ error: 'Bid not found' });
      return;
    }

    // Role-based access check
    if (req.user!.role === 'TRANSPORTER' && bid.transporterId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden: You do not own this bid' });
      return;
    }

    res.json({ bid });
  } catch (error) {
    console.error('Error fetching bid details:', error);
    res.status(500).json({ error: 'Failed to fetch bid details' });
  }
});

/**
 * POST /bids/:id/withdraw - Withdraw a pending bid
 * Requires: Authentication, Roles: TRANSPORTER | SYSTEM_ADMIN
 */
router.post('/:id/withdraw', JwtAuthGuard, RolesGuard(['TRANSPORTER', 'SYSTEM_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [bid] = await db.select().from(bids).where(eq(bids.id, id));
    if (!bid) {
      res.status(404).json({ error: 'Bid not found' });
      return;
    }

    if (req.user!.role !== 'SYSTEM_ADMIN' && bid.transporterId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden: You do not own this bid' });
      return;
    }

    if (bid.status !== 'PENDING') {
      res.status(400).json({ error: `Cannot withdraw bid with status '${bid.status}'` });
      return;
    }

    const [updatedBid] = await db.update(bids)
      .set({ status: 'WITHDRAWN', updatedAt: new Date() })
      .where(eq(bids.id, id))
      .returning();

    res.json({ message: 'Bid withdrawn successfully', bid: updatedBid });
  } catch (error) {
    console.error('Error withdrawing bid:', error);
    res.status(500).json({ error: 'Failed to withdraw bid' });
  }
});

export const bidsRoutes = router;
