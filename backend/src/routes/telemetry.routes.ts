import { Router, Request, Response } from 'express';
import { db } from '../db';
import { telemetryLogs } from '../db/schema/telemetry_logs';
import { shipments } from '../db/schema/shipments';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { eq } from 'drizzle-orm';
import { socketGateway } from '../main';

const router = Router();

// POST /telemetry/ingest - Ingest GPS pings from trucks (FR-03.1)
router.post('/ingest', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { shipmentId, lat, lng, speed, status, eta } = req.body;

    if (!shipmentId || !lat || !lng) {
      res.status(400).json({ error: 'Missing required telemetry fields' });
      return;
    }

    // Insert into telemetry_logs table
    const [insertedLog] = await db.insert(telemetryLogs).values({
      shipmentId,
      lat,
      lng,
      speed,
      status: status || 'SAFE',
      eta
    }).returning();

    // Verify shipment exists and get details for broadcast
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, shipmentId),
      with: {
        driver: true,
        load: true
      }
    });

    if (shipment) {
      // Broadcast live update via Socket.io
      const globalGateway = (global as any).socketGateway;
      if (globalGateway) {
        globalGateway.server.to('general').emit('telemetry-update', {
          id: `TRK-${shipmentId.substring(0,4).toUpperCase()}`,
          lat,
          lng,
          speed,
          cargo: shipment.load?.title || 'Unknown Cargo',
          driver: shipment.driver?.fullName || 'Unknown Driver',
          status: status || 'SAFE',
          eta
        });
      }
    }

    res.status(200).json({ success: true, log: insertedLog });
  } catch (error) {
    console.error('Error ingesting telemetry:', error);
    res.status(500).json({ error: 'Failed to ingest telemetry' });
  }
});

// GET /telemetry/live-assets - Fetch latest active assets
router.get('/live-assets', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    // For MVP, we get active shipments and simulate their location if no logs exist
    const activeShipments = await db.query.shipments.findMany({
      where: eq(shipments.status, 'IN_TRANSIT'),
      with: {
        driver: true,
        load: true
      }
    });

    // Fetch the latest log for each shipment
    const trucks = await Promise.all(activeShipments.map(async (s, i) => {
      const logs = await db.query.telemetryLogs.findMany({
        where: eq(telemetryLogs.shipmentId, s.id),
        orderBy: (logs, { desc }) => [desc(logs.timestamp)],
        limit: 1
      });

      const log = logs[0];
      
      // If we have a log, use it. Otherwise, simulate one based on index for the map to not be empty
      if (log) {
        return {
          id: `TRK-${s.id.substring(0,4).toUpperCase()}`,
          lat: log.lat,
          lng: log.lng,
          speed: log.speed || 0,
          cargo: s.load?.title || 'Unknown Cargo',
          driver: s.driver?.fullName || 'Unknown Driver',
          eta: log.eta || 'Unknown',
          status: log.status || 'SAFE'
        };
      } else {
        // Fallback simulation to keep the map populated if no real data is ingested yet
        const isBreach = i % 2 !== 0;
        return {
          id: `TRK-${s.id.substring(0,4).toUpperCase()}`,
          lat: 11.5 + (i * 0.05),
          lng: 42.5 - (i * 0.1),
          speed: 40 + (i * 5),
          cargo: s.load?.title || 'Cargo',
          driver: s.driver?.fullName || 'Driver',
          eta: `${i+1}.5h`,
          status: isBreach ? 'GEOFENCE_BREACH' : 'SAFE'
        };
      }
    }));

    res.status(200).json({ trucks });
  } catch (error) {
    console.error('Error fetching live assets:', error);
    res.status(500).json({ error: 'Failed to fetch live assets' });
  }
});

export const telemetryRoutes = router;
