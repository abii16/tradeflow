import { Router, Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  SyncBatchRequestSchema,
  CheckInItemSchema,
  IncidentItemSchema,
  QueryTrailSchema,
  QueryIncidentsSchema,
} from '../dto/offline-sync.dto';
import { offlineSyncService } from '../modules/offline-sync';

const router = Router();

// Helper to safely emit socket events if socket gateway is active
const getSocketEmitter = () => {
  return (room: string, event: string, payload: any) => {
    try {
      const gateway = (global as any).socketGateway;
      if (gateway && typeof gateway.emitToRoom === 'function') {
        gateway.emitToRoom(room, event, payload);
      }
    } catch {
      // Non-blocking socket error
    }
  };
};

/**
 * POST /sync/batch (or /sync/driver)
 * Process queued offline driver check-ins, telemetry pings, and incident reports upon reconnection.
 * Requires: Authentication, Roles: DRIVER | TRANSPORTER | SYSTEM_ADMIN
 */
const handleBatchSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = SyncBatchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid sync batch payload', details: parsed.error.errors });
      return;
    }

    const socketEmitter = getSocketEmitter();
    const result = await offlineSyncService.processSyncBatch(req.user!, parsed.data, socketEmitter);

    const statusCode = result.status === 'FAILED' ? 400 : result.status === 'PARTIAL_SUCCESS' ? 207 : 200;
    res.status(statusCode).json({
      message:
        result.status === 'COMPLETED'
          ? 'Offline batch synced successfully'
          : result.status === 'PARTIAL_SUCCESS'
          ? 'Offline batch synced with partial warnings'
          : 'Offline batch processing failed',
      ...result,
    });
  } catch (error: any) {
    console.error('[OfflineSync Route] Error processing batch sync:', error);
    res.status(500).json({ error: error.message || 'Internal error processing offline sync batch' });
  }
};

router.post('/batch', JwtAuthGuard, RolesGuard(['DRIVER', 'TRANSPORTER', 'SYSTEM_ADMIN']), handleBatchSync);
router.post('/driver', JwtAuthGuard, RolesGuard(['DRIVER', 'TRANSPORTER', 'SYSTEM_ADMIN']), handleBatchSync);

/**
 * POST /sync/checkin
 * Ingest a single real-time or offline check-in
 * Requires: Authentication, Roles: DRIVER | TRANSPORTER | SYSTEM_ADMIN
 */
router.post(
  '/checkin',
  JwtAuthGuard,
  RolesGuard(['DRIVER', 'TRANSPORTER', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = CheckInItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid check-in payload', details: parsed.error.errors });
        return;
      }

      const socketEmitter = getSocketEmitter();
      const result = await offlineSyncService.processSingleCheckIn(req.user!, parsed.data, socketEmitter);

      const statusCode = result.status === 'FAILED' ? 400 : 200;
      res.status(statusCode).json(result);
    } catch (error: any) {
      console.error('[OfflineSync Route] Error processing single check-in:', error);
      res.status(500).json({ error: error.message || 'Internal error processing check-in' });
    }
  }
);

/**
 * POST /sync/incident
 * Ingest a single driver incident report
 * Requires: Authentication, Roles: DRIVER | TRANSPORTER | SYSTEM_ADMIN
 */
router.post(
  '/incident',
  JwtAuthGuard,
  RolesGuard(['DRIVER', 'TRANSPORTER', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = IncidentItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid incident payload', details: parsed.error.errors });
        return;
      }

      const socketEmitter = getSocketEmitter();
      const result = await offlineSyncService.processSingleIncident(req.user!, parsed.data, socketEmitter);

      const statusCode = result.status === 'FAILED' ? 400 : 200;
      res.status(statusCode).json(result);
    } catch (error: any) {
      console.error('[OfflineSync Route] Error processing incident report:', error);
      res.status(500).json({ error: error.message || 'Internal error processing incident report' });
    }
  }
);

/**
 * GET /sync/shipments/:shipmentId/trail
 * Retrieve the full chronological GPS breadcrumb trail and check-in timeline for map tracking
 * Requires: Authentication
 */
router.get(
  '/shipments/:shipmentId/trail',
  JwtAuthGuard,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipmentId } = req.params;
      const parsed = QueryTrailSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.errors });
        return;
      }

      const trailData = await offlineSyncService.getShipmentTrail(shipmentId, req.user!, parsed.data);
      res.status(200).json(trailData);
    } catch (error: any) {
      console.error('[OfflineSync Route] Error retrieving shipment trail:', error);
      const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message || 'Failed to fetch shipment trail' });
    }
  }
);

/**
 * GET /sync/shipments/:shipmentId/incidents
 * Retrieve all incidents logged on a shipment
 * Requires: Authentication
 */
router.get(
  '/shipments/:shipmentId/incidents',
  JwtAuthGuard,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipmentId } = req.params;
      const parsed = QueryIncidentsSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.errors });
        return;
      }

      const incidentsData = await offlineSyncService.getShipmentIncidents(shipmentId, req.user!, parsed.data);
      res.status(200).json(incidentsData);
    } catch (error: any) {
      console.error('[OfflineSync Route] Error retrieving shipment incidents:', error);
      const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message || 'Failed to fetch shipment incidents' });
    }
  }
);

/**
 * GET /sync/batches/history
 * Retrieve driver's sync batch history
 * Requires: Authentication
 */
router.get(
  '/batches/history',
  JwtAuthGuard,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const driverId = (req.query.driverId as string) || req.user!.id;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const history = await offlineSyncService.getDriverSyncHistory(driverId, req.user!, limit, offset);
      res.status(200).json(history);
    } catch (error: any) {
      console.error('[OfflineSync Route] Error retrieving sync history:', error);
      const status = error.message.includes('Forbidden') ? 403 : 500;
      res.status(status).json({ error: error.message || 'Failed to fetch sync history' });
    }
  }
);

export const offlineSyncRoutes = router;
