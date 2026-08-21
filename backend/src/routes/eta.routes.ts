import { Router, Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const router = Router();

router.use(JwtAuthGuard);

/**
 * GET /eta/projections
 * Fetches Deep ETA predictions for Modjo Dry Port and Galafi Border
 */
router.get('/projections', async (req: Request, res: Response) => {
  try {
    // Simulated PyTorch Deep ETA predictions
    res.status(200).json({
      projections: [
        {
          destination: 'Modjo Dry Port',
          estimatedArrival: '14:30 EAT',
          progressPercent: 85,
          confidence: '99.1%'
        },
        {
          destination: 'Galafi Border Checkpoint',
          estimatedArrival: '21:00 EAT',
          progressPercent: 30,
          confidence: '94.5%'
        }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch ETA projections' });
  }
});

export const etaRoutes = router;
