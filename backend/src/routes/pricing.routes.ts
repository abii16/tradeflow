import { Router, Request, Response } from 'express';
import { pricingService } from '../modules/pricing/pricing.service';
import { SpotPricingRequestSchema, ContractEvaluationRequestSchema } from '../dto/pricing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { db } from '../db';
import { priceQuotes } from '../db/schema/price_quotes';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// POST /pricing/quote - Calculate dynamic spot rate (Open to authenticated and guest users for quotes)
router.post('/quote', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = SpotPricingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input parameters', details: parsed.error.errors });
      return;
    }

    const shipperId = req.user?.id;
    const quote = await pricingService.calculateSpotRate(parsed.data, shipperId);
    res.status(200).json(quote);
  } catch (error) {
    console.error('Error calculating spot rate:', error);
    res.status(500).json({ error: 'Failed to calculate spot rate' });
  }
});

// POST /pricing/evaluate-contract - Evaluate contract divergence against spot market (FR-04.2)
router.post('/evaluate-contract', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = ContractEvaluationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input parameters', details: parsed.error.errors });
      return;
    }

    const shipperId = req.user?.id;
    const evaluation = await pricingService.evaluateContractRate(parsed.data, shipperId);
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error evaluating contract rate:', error);
    res.status(500).json({ error: 'Failed to evaluate contract rate' });
  }
});

// GET /pricing/corridors - List trade corridors with live rates and fuel index
router.get('/corridors', async (req: Request, res: Response): Promise<void> => {
  try {
    const corridors = await pricingService.getCorridors();
    res.status(200).json({ corridors });
  } catch (error) {
    console.error('Error fetching corridors:', error);
    res.status(500).json({ error: 'Failed to fetch corridors' });
  }
});

// GET /pricing/quotes/history - Shippers view their calculation history (FR-04.3)
router.get('/quotes/history', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const quotes = await db.select().from(priceQuotes)
      .where(eq(priceQuotes.shipperId, req.user!.id))
      .orderBy(desc(priceQuotes.createdAt))
      .limit(50);

    res.status(200).json({ quotes });
  } catch (error) {
    console.error('Error fetching quote history:', error);
    res.status(500).json({ error: 'Failed to fetch quote history' });
  }
});

export const pricingRoutes = router;
