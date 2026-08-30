import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/v1/risk-zones
 * Returns active geofenced risk zones along the Djibouti-Addis corridor.
 * No auth required — used by the Live Radar map overlay (FR-05.3).
 */
router.get('/', (_req: Request, res: Response) => {
  const zones = [
    {
      id: 'rz-001',
      title: 'Galafi Border Checkpoint',
      name: 'Galafi Border Checkpoint',
      description: 'Active customs congestion & vehicle inspection zone. Expect 2-4hr delays.',
      severity: 'MEDIUM',
      type: 'CUSTOMS_DELAY',
      lat: 11.716,
      lng: 41.838,
      radius: 15000,
    },
    {
      id: 'rz-002',
      title: 'Mille Flood Risk Zone',
      name: 'Mille Flood Risk Zone',
      description: 'Seasonal flooding risk along the Awash River crossing. Heavy vehicles advised to use alternate route.',
      severity: 'HIGH',
      type: 'ROAD_HAZARD',
      lat: 11.432,
      lng: 40.805,
      radius: 20000,
    },
    {
      id: 'rz-003',
      title: 'Dire Dawa Security Alert',
      name: 'Dire Dawa Security Alert',
      description: 'Elevated security monitoring zone. Mandatory checkpoint clearance required.',
      severity: 'LOW',
      type: 'SECURITY',
      lat: 9.593,
      lng: 41.866,
      radius: 12000,
    },
  ];

  res.json({ data: zones, total: zones.length });
});

export const riskZonesRoutes = router;
