import { Router, Request, Response } from 'express';
import { db } from '../db';
import { telemetryLogs } from '../db/schema/telemetry_logs';
import { shipments } from '../db/schema/shipments';
import { users } from '../db/schema/users';
import { loads } from '../db/schema/loads';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { eq } from 'drizzle-orm';


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
    }) as any;

    if (shipment) {
      // Broadcast live update via Socket.io
      const sg = (global as any).socketGateway;
      if (sg) {
        sg.broadcastToRoom(shipment.loadId, 'eta_update', {
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
    const activeShipments = await db.select({
      id: shipments.id,
      loadId: shipments.loadId,
      driverName: users.fullName,
      loadTitle: loads.title,
      cargoType: loads.cargoType
    })
    .from(shipments)
    .leftJoin(users, eq(shipments.driverId, users.id))
    .leftJoin(loads, eq(shipments.loadId, loads.id))
    .where(eq(shipments.status, 'IN_TRANSIT'));

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
          cargo: s.loadTitle || s.cargoType || 'Unknown Cargo',
          driver: s.driverName || 'Unknown Driver',
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
          cargo: s.loadTitle || s.cargoType || 'Cargo',
          driver: s.driverName || 'Driver',
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

// GET /telemetry/simulate - Test endpoint to emit telemetry
router.get('/simulate', async (req: Request, res: Response): Promise<void> => {
  const globalGateway = (global as any).socketGateway;
  if (globalGateway) {
    // We will simulate a truck moving from Djibouti to Addis
    const lat = Number(req.query.lat) || 11.588;
    const lng = Number(req.query.lng) || 43.145;
    const id = req.query.id || 'TRK-DEMO';
    
    globalGateway.emitToRoom('general', 'telemetry-update', {
      id,
      lat,
      lng,
      speed: 60,
      cargo: 'Coffee Beans',
      driver: 'Abebe Bikila',
      status: 'SAFE',
      eta: '4.5h'
    });
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Gateway not ready' });
  }
});

export const telemetryRoutes = router;
