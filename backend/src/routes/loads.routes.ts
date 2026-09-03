import { Router, Request, Response } from 'express';
import { db } from '../db';
import { loads } from '../db/schema/loads';
import { bids } from '../db/schema/bids';
import { users } from '../db/schema/users';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateLoadSchema, QueryLoadSchema, UpdateLoadStatusSchema } from '../dto/loads.dto';

const router = Router();

// POST /loads - Create a new load (Requires Auth + Roles: SHIPPER, SYSTEM_ADMIN)
router.post('/', JwtAuthGuard, RolesGuard(['SHIPPER', 'SYSTEM_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = CreateLoadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
      return;
    }

    const data = parsed.data;
    
    // Calculate expiresAt from expiryHours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.expiryHours);

    const [newLoad] = await db.insert(loads).values({
      shipperId: req.user!.id, // Set automatically from the authenticated user
      title: data.title,
      description: data.description,
      origin: data.origin,
      destination: data.destination,
      weightKg: data.weightKg.toString(),
      volumeM3: data.volumeM3?.toString(),
      cargoType: data.cargoType,
      budgetAmount: data.budgetAmount.toString(),
      currency: data.currency,
      expiresAt: expiresAt,
      status: 'POSTED',
    }).returning();

    // --- MOCK BIDS GENERATION FOR DEMO PURPOSES ---
    const transporters = await db.select().from(users).where(eq(users.role, 'TRANSPORTER')).limit(3);
    
    if (transporters.length > 0) {
       const mockBids = transporters.map((t, index) => {
         // Vary the bid amount around the budget
         const variance = 1 - (index * 0.05); // e.g. 1.0, 0.95, 0.90 of budget
         const bidAmount = (Number(data.budgetAmount) * variance).toString();
         
         return {
           loadId: newLoad.id,
           transporterId: t.id,
           bidAmount,
           currency: data.currency,
           status: 'PENDING' as const,
         };
       });
       
       await db.insert(bids).values(mockBids);
    }
    // ----------------------------------------------

    res.status(201).json({ message: 'Load created successfully', load: newLoad });
  } catch (error) {
    console.error('Error creating load:', error);
    res.status(500).json({ error: 'Failed to create load' });
  }
});

// GET /loads - List active loads with filtering & pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = QueryLoadSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.errors });
      return;
    }

    const { status, minPrice, maxPrice, cargoType, limit, offset } = parsed.data;

    const conditions = [];
    if (status) conditions.push(eq(loads.status, status));
    if (cargoType) conditions.push(eq(loads.cargoType, cargoType));
    
    // budgetAmount in schema is decimal
    if (minPrice !== undefined) conditions.push(gte(loads.budgetAmount, minPrice.toString()));
    if (maxPrice !== undefined) conditions.push(lte(loads.budgetAmount, maxPrice.toString()));

    const query = db.select().from(loads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(loads.createdAt));

    const results = await query;
    res.json({ loads: results });
  } catch (error) {
    console.error('Error fetching loads:', error);
    res.status(500).json({ error: 'Failed to fetch loads' });
  }
});

// GET /loads/:id - Get single load details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [load] = await db.select().from(loads).where(eq(loads.id, id));

    if (!load) {
      res.status(404).json({ error: 'Load not found' });
      return;
    }

    res.json({ load });
  } catch (error) {
    console.error('Error fetching load details:', error);
    res.status(500).json({ error: 'Failed to fetch load details' });
  }
});

// PATCH /loads/:id/status - Update load status
router.patch('/:id/status', JwtAuthGuard, RolesGuard(['SHIPPER', 'SYSTEM_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = UpdateLoadStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
      return;
    }

    // Verify ownership (only Shipper who owns it or SYSTEM_ADMIN)
    const [load] = await db.select().from(loads).where(eq(loads.id, id));
    if (!load) {
      res.status(404).json({ error: 'Load not found' });
      return;
    }

    if (req.user!.role !== 'SYSTEM_ADMIN' && load.shipperId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden: You do not own this load' });
      return;
    }

    const [updatedLoad] = await db.update(loads)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(loads.id, id))
      .returning();

    res.json({ message: 'Load status updated', load: updatedLoad });
  } catch (error) {
    console.error('Error updating load status:', error);
    res.status(500).json({ error: 'Failed to update load status' });
  }
});

export const loadsRoutes = router;
