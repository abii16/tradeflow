import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import {
  CheckInItemSchema,
  IncidentItemSchema,
  SyncBatchRequestSchema,
  QueryTrailSchema,
  QueryIncidentsSchema,
} from '../src/dto/offline-sync.dto';
import { OfflineSyncService } from '../src/modules/offline-sync/offline-sync.service';

// Mock Guards
jest.mock('../src/auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: (req: any, res: any, next: any) => {
    req.user = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'driver.bekele@tradeflow.et',
      fullName: 'Bekele Tessema',
      role: 'DRIVER',
      createdAt: new Date().toISOString(),
      isVerified: true,
    };
    next();
  },
}));

jest.mock('../src/auth/guards/roles.guard', () => ({
  RolesGuard: () => (req: any, res: any, next: any) => next(),
}));

// Mock DB module
jest.mock('../src/db', () => {
  const mockDb = {
    select: jest.fn<any>(),
    insert: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
  };
  return { db: mockDb };
});

import { db } from '../src/db';
import { offlineSyncRoutes } from '../src/routes/offline-sync.routes';

describe('Offline Driver Check-in Sync Subsystem (TF-205 / Day 5 PR Merge #2)', () => {
  let service: OfflineSyncService;
  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'driver.bekele@tradeflow.et',
    fullName: 'Bekele Tessema',
    role: 'DRIVER',
    createdAt: new Date().toISOString(),
    isVerified: true,
  };

  const sampleShipmentId = '22222222-2222-2222-2222-222222222222';
  const sampleLoadId = '33333333-3333-3333-3333-333333333333';

  // Create test express app
  const app = express();
  app.use(express.json());
  app.use('/sync', offlineSyncRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OfflineSyncService();
  });

  describe('1. DTO Validation & Schema Constraints (Zod)', () => {
    it('should validate a valid GPS telemetry check-in ping', () => {
      const validCheckIn = {
        clientRecordId: 'REC-GPS-001',
        shipmentId: sampleShipmentId,
        eventType: 'GPS_PING',
        latitude: 11.588,
        longitude: 43.145,
        speedKmH: 65.5,
        heading: 180.0,
        accuracy: 4.5,
        odometerKm: 12450.2,
        batteryLevel: 88,
        locationName: 'Djibouti Outskirts',
        clientTimestamp: '2026-08-13T08:30:00.000Z',
      };

      const result = CheckInItemSchema.safeParse(validCheckIn);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(11.588);
        expect(result.data.clientTimestamp).toBeInstanceOf(Date);
        expect(result.data.eventType).toBe('GPS_PING');
      }
    });

    it('should reject invalid latitude (> 90 or < -90) and longitude', () => {
      const invalidCoords = {
        clientRecordId: 'REC-ERR-001',
        shipmentId: sampleShipmentId,
        latitude: 95.0, // Invalid
        longitude: 43.145,
        clientTimestamp: '2026-08-13T08:30:00.000Z',
      };

      const result = CheckInItemSchema.safeParse(invalidCoords);
      expect(result.success).toBe(false);
    });

    it('should reject invalid shipment UUID format in check-in', () => {
      const invalidUUID = {
        clientRecordId: 'REC-ERR-002',
        shipmentId: 'not-a-valid-uuid',
        latitude: 11.588,
        longitude: 43.145,
        clientTimestamp: '2026-08-13T08:30:00.000Z',
      };

      const result = CheckInItemSchema.safeParse(invalidUUID);
      expect(result.success).toBe(false);
    });

    it('should validate waypoint milestone check-in with Proof of Delivery (PoD)', () => {
      const deliveryCheckIn = {
        clientRecordId: 'REC-POD-001',
        shipmentId: sampleShipmentId,
        eventType: 'DELIVERY_POD',
        status: 'DELIVERED',
        latitude: 8.592,
        longitude: 39.123,
        locationName: 'Modjo Dry Port Terminal 2',
        podPhotoUrl: 'https://storage.tradeflow.et/pod/photo-123.jpg',
        podSignatureUrl: 'https://storage.tradeflow.et/pod/sig-123.png',
        notes: 'Consignee received 400 sacks of export grade coffee in sound condition.',
        clientTimestamp: '2026-08-13T14:45:00.000Z',
      };

      const result = CheckInItemSchema.safeParse(deliveryCheckIn);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('DELIVERED');
        expect(result.data.podPhotoUrl).toBeDefined();
      }
    });

    it('should validate a geotagged incident report', () => {
      const validIncident = {
        clientRecordId: 'INC-001',
        shipmentId: sampleShipmentId,
        incidentType: 'CHECKPOINT_DELAY',
        severity: 'HIGH',
        description: 'Customs scanner calibration delay at Galafi Border. Estimated 3 hours queue.',
        latitude: 11.712,
        longitude: 41.845,
        locationName: 'Galafi Border Checkpoint',
        mediaUrls: ['https://storage.tradeflow.et/incidents/galafi-queue.jpg'],
        clientTimestamp: '2026-08-13T10:15:00.000Z',
      };

      const result = IncidentItemSchema.safeParse(validIncident);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.incidentType).toBe('CHECKPOINT_DELAY');
        expect(result.data.severity).toBe('HIGH');
      }
    });

    it('should validate full sync batch request payload with device metadata', () => {
      const batchPayload = {
        batchId: 'BATCH-20260813-001',
        deviceInfo: {
          appVersion: '1.4.2',
          os: 'Android 14',
          platform: 'Expo React Native',
          batteryLevel: 76,
          networkType: 'LTE_RECONNECTED',
          deviceId: 'SAMSUNG-SM-A546E',
        },
        checkIns: [
          {
            clientRecordId: 'REC-1',
            shipmentId: sampleShipmentId,
            eventType: 'GPS_PING',
            latitude: 11.58,
            longitude: 43.14,
            clientTimestamp: '2026-08-13T08:00:00.000Z',
          },
          {
            clientRecordId: 'REC-2',
            shipmentId: sampleShipmentId,
            eventType: 'WAYPOINT_CHECKIN',
            status: 'IN_CUSTOMS',
            latitude: 11.71,
            longitude: 41.84,
            clientTimestamp: '2026-08-13T10:00:00.000Z',
          },
        ],
        incidents: [
          {
            clientRecordId: 'INC-1',
            shipmentId: sampleShipmentId,
            incidentType: 'FUEL_UNAVAILABILITY',
            severity: 'MEDIUM',
            description: 'No diesel at TotalEnergies Mille station.',
            clientTimestamp: '2026-08-13T11:00:00.000Z',
          },
        ],
        clientTimestamp: '2026-08-13T12:00:00.000Z',
      };

      const result = SyncBatchRequestSchema.safeParse(batchPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkIns.length).toBe(2);
        expect(result.data.incidents.length).toBe(1);
        expect(result.data.deviceInfo?.platform).toBe('Expo React Native');
      }
    });

    it('should validate query trail parameters with defaults', () => {
      const query = {
        limit: '50',
        offset: '10',
        since: '2026-08-13T00:00:00.000Z',
        eventType: 'GPS_PING',
      };

      const result = QueryTrailSchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(10);
      }
    });

    it('should validate query incidents filter schema', () => {
      const query = {
        severity: 'CRITICAL',
        incidentType: 'ACCIDENT',
        limit: '25',
      };

      const result = QueryIncidentsSchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severity).toBe('CRITICAL');
        expect(result.data.incidentType).toBe('ACCIDENT');
      }
    });
  });

  describe('2. Batch Processing & Conflict Resolution Logic', () => {
    it('should process multi-item offline batch in chronological order', async () => {
      const mockDb = db as any;

      // 1. Batch ID check -> Not existing
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });

      // For checkIn 1:
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([
            {
              id: sampleShipmentId,
              loadId: sampleLoadId,
              driverId: mockUser.id,
              transporterId: mockUser.id,
              status: 'DISPATCHED',
            },
          ] as any),
        }),
      });
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn<any>().mockReturnValue({
          returning: jest.fn<any>().mockResolvedValue([{ id: 'chk-uuid-1' }] as any),
        }),
      });

      // For checkIn 2:
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([
            {
              id: sampleShipmentId,
              loadId: sampleLoadId,
              driverId: mockUser.id,
              transporterId: mockUser.id,
              status: 'DISPATCHED',
            },
          ] as any),
        }),
      });
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn<any>().mockReturnValue({
          returning: jest.fn<any>().mockResolvedValue([{ id: 'chk-uuid-2' }] as any),
        }),
      });

      // Update shipment state
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([
            {
              id: sampleShipmentId,
              loadId: sampleLoadId,
              status: 'DISPATCHED',
            },
          ] as any),
        }),
      });
      mockDb.update.mockReturnValueOnce({
        set: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockReturnValue({
            returning: jest.fn<any>().mockResolvedValue([
              {
                id: sampleShipmentId,
                status: 'IN_TRANSIT',
                currentLat: 9.35,
                currentLng: 40.5,
                updatedAt: new Date(),
              },
            ] as any),
          }),
        }),
      });
      // Update loads state
      mockDb.update.mockReturnValueOnce({
        set: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });

      // Incident 1:
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn<any>().mockReturnValue({
          returning: jest.fn<any>().mockResolvedValue([{ id: 'inc-uuid-1' }] as any),
        }),
      });

      // Insert sync batch log
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn<any>().mockResolvedValue([] as any),
      });

      const batchPayload = {
        batchId: 'BATCH-ORDER-TEST-001',
        checkIns: [
          {
            clientRecordId: 'REC-LATER',
            shipmentId: sampleShipmentId,
            eventType: 'STATUS_UPDATE' as const,
            status: 'IN_TRANSIT' as const,
            latitude: 9.35,
            longitude: 40.5,
            clientTimestamp: new Date('2026-08-13T11:30:00.000Z'),
          },
          {
            clientRecordId: 'REC-EARLIER',
            shipmentId: sampleShipmentId,
            eventType: 'WAYPOINT_CHECKIN' as const,
            status: 'PICKED_UP' as const,
            latitude: 11.588,
            longitude: 43.145,
            clientTimestamp: new Date('2026-08-13T08:00:00.000Z'),
          },
        ],
        incidents: [
          {
            clientRecordId: 'INC-ROADS',
            shipmentId: sampleShipmentId,
            incidentType: 'ROAD_BLOCKAGE' as const,
            severity: 'HIGH' as const,
            description: 'Road work near Awash',
            clientTimestamp: new Date('2026-08-13T09:45:00.000Z'),
          },
        ],
        clientTimestamp: new Date('2026-08-13T12:00:00.000Z'),
      };

      const mockEmitter = jest.fn<any>();
      const result = await service.processSyncBatch(mockUser, batchPayload as any, mockEmitter);

      expect(result.status).toBe('COMPLETED');
      expect(result.summary.checkInsProcessed).toBe(2);
      expect(result.summary.incidentsProcessed).toBe(1);
      expect(result.summary.duplicatesSkipped).toBe(0);
      expect(result.summary.errorsCount).toBe(0);
      expect(mockEmitter).toHaveBeenCalled();
    });

    it('should deduplicate items with existing clientRecordId', async () => {
      const mockDb = db as any;

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([{ id: 'existing-id-1' }] as any),
        }),
      });

      mockDb.insert.mockReturnValueOnce({
        values: jest.fn<any>().mockResolvedValue([] as any),
      });

      const batchPayload = {
        batchId: 'BATCH-DUP-TEST-001',
        checkIns: [
          {
            clientRecordId: 'ALREADY-SYNCED-001',
            shipmentId: sampleShipmentId,
            eventType: 'GPS_PING' as const,
            latitude: 11.58,
            longitude: 43.14,
            clientTimestamp: new Date('2026-08-13T08:00:00.000Z'),
          },
        ],
        incidents: [],
        clientTimestamp: new Date('2026-08-13T12:00:00.000Z'),
      };

      const result = await service.processSyncBatch(mockUser, batchPayload as any);

      expect(result.summary.duplicatesSkipped).toBe(1);
      expect(result.summary.checkInsProcessed).toBe(0);
      expect(result.duplicateClientRecordIds).toContain('ALREADY-SYNCED-001');
    });

    it('should return stored batch summary if batchId was previously processed (Idempotency)', async () => {
      const mockDb = db as any;

      const previousSummary = {
        batchId: 'BATCH-REPLAY-001',
        status: 'COMPLETED',
        syncedAt: '2026-08-13T09:00:00.000Z',
        summary: {
          totalReceived: 5,
          checkInsProcessed: 5,
          incidentsProcessed: 0,
          duplicatesSkipped: 0,
          errorsCount: 0,
        },
        processedCheckInIds: ['chk-1', 'chk-2', 'chk-3', 'chk-4', 'chk-5'],
        processedIncidentIds: [],
        duplicateClientRecordIds: [],
        errors: [],
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([
            {
              batchId: 'BATCH-REPLAY-001',
              status: 'COMPLETED',
              syncedAt: new Date('2026-08-13T09:00:00.000Z'),
              summary: previousSummary,
            },
          ] as any),
        }),
      });

      const batchPayload = {
        batchId: 'BATCH-REPLAY-001',
        checkIns: [],
        incidents: [],
        clientTimestamp: new Date('2026-08-13T09:00:00.000Z'),
      };

      const result = await service.processSyncBatch(mockUser, batchPayload as any);

      expect(result.batchId).toBe('BATCH-REPLAY-001');
      expect(result.status).toBe('COMPLETED');
      expect(result.summary.checkInsProcessed).toBe(5);
    });

    it('should handle partial failure gracefully when an invalid shipment ID is provided', async () => {
      const mockDb = db as any;

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });

      mockDb.insert.mockReturnValueOnce({
        values: jest.fn<any>().mockResolvedValue([] as any),
      });

      const batchPayload = {
        batchId: 'BATCH-PARTIAL-FAIL-001',
        checkIns: [
          {
            clientRecordId: 'REC-NONEXISTENT',
            shipmentId: '99999999-9999-9999-9999-999999999999',
            eventType: 'GPS_PING' as const,
            latitude: 11.58,
            longitude: 43.14,
            clientTimestamp: new Date('2026-08-13T08:00:00.000Z'),
          },
        ],
        incidents: [],
        clientTimestamp: new Date('2026-08-13T12:00:00.000Z'),
      };

      const result = await service.processSyncBatch(mockUser, batchPayload as any);

      expect(result.status).toBe('FAILED');
      expect(result.summary.errorsCount).toBe(1);
      expect(result.errors[0].error).toContain('not found');
    });
  });

  describe('3. Express Router Endpoints (Supertest)', () => {
    it('POST /sync/batch should return 200 when batch is valid and processed', async () => {
      const mockDb = db as any;

      // 1. Batch ID check -> Not existing
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });

      // Item 1: duplicate check -> none
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([] as any),
        }),
      });
      // Item 1: shipment check -> exists
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([
            {
              id: sampleShipmentId,
              loadId: sampleLoadId,
              driverId: mockUser.id,
              transporterId: mockUser.id,
              status: 'DISPATCHED',
            },
          ] as any),
        }),
      });
      // Item 1: insert
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn<any>().mockReturnValue({
          returning: jest.fn<any>().mockResolvedValue([{ id: 'chk-1' }] as any),
        }),
      });

      // Shipment update
      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([
            {
              id: sampleShipmentId,
              loadId: sampleLoadId,
              status: 'DISPATCHED',
            },
          ] as any),
        }),
      });
      mockDb.update.mockReturnValueOnce({
        set: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockReturnValue({
            returning: jest.fn<any>().mockResolvedValue([
              {
                id: sampleShipmentId,
                status: 'DISPATCHED',
                currentLat: 11.588,
                currentLng: 43.145,
                updatedAt: new Date(),
              },
            ] as any),
          }),
        }),
      });

      // Sync batch log insert
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn<any>().mockResolvedValue([] as any),
      });

      const res = await request(app)
        .post('/sync/batch')
        .send({
          batchId: 'BATCH-HTTP-001',
          checkIns: [
            {
              clientRecordId: 'HTTP-REC-1',
              shipmentId: sampleShipmentId,
              eventType: 'GPS_PING',
              latitude: 11.588,
              longitude: 43.145,
              clientTimestamp: '2026-08-13T08:30:00.000Z',
            },
          ],
          incidents: [],
          clientTimestamp: '2026-08-13T08:35:00.000Z',
        });

      expect(res.status).toBe(200);
      expect(res.body.batchId).toBe('BATCH-HTTP-001');
      expect(res.body.summary.checkInsProcessed).toBe(1);
    });

    it('POST /sync/batch should return 400 on malformed payload', async () => {
      const res = await request(app).post('/sync/batch').send({
        // Missing batchId and clientTimestamp
        checkIns: [{ latitude: 999 }],
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid sync batch payload');
    });

    it('GET /sync/shipments/:shipmentId/trail should return chronological GPS trail', async () => {
      const mockDb = db as any;

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([
            {
              id: sampleShipmentId,
              driverId: mockUser.id,
              transporterId: mockUser.id,
              status: 'IN_TRANSIT',
              currentLat: 9.5,
              currentLng: 40.2,
            },
          ] as any),
        }),
      });

      const mockTrail = [
        {
          id: 'chk-1',
          shipmentId: sampleShipmentId,
          latitude: 11.58,
          longitude: 43.14,
          clientTimestamp: new Date('2026-08-13T08:00:00.000Z'),
        },
        {
          id: 'chk-2',
          shipmentId: sampleShipmentId,
          latitude: 9.5,
          longitude: 40.2,
          clientTimestamp: new Date('2026-08-13T10:00:00.000Z'),
        },
      ];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockReturnValue({
            orderBy: jest.fn<any>().mockReturnValue({
              limit: jest.fn<any>().mockReturnValue({
                offset: jest.fn<any>().mockResolvedValue(mockTrail as any),
              }),
            }),
          }),
        }),
      });

      const res = await request(app).get(`/sync/shipments/${sampleShipmentId}/trail`);

      expect(res.status).toBe(200);
      expect(res.body.shipmentId).toBe(sampleShipmentId);
      expect(res.body.count).toBe(2);
      expect(res.body.trail.length).toBe(2);
    });

    it('GET /sync/shipments/:shipmentId/incidents should return logged incidents', async () => {
      const mockDb = db as any;

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockResolvedValue([
            {
              id: sampleShipmentId,
              driverId: mockUser.id,
              transporterId: mockUser.id,
              status: 'IN_TRANSIT',
            },
          ] as any),
        }),
      });

      const mockIncidents = [
        {
          id: 'inc-1',
          shipmentId: sampleShipmentId,
          incidentType: 'ACCIDENT',
          severity: 'HIGH',
          description: 'Minor tire puncture',
          clientTimestamp: new Date('2026-08-13T09:00:00.000Z'),
        },
      ];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn<any>().mockReturnValue({
          where: jest.fn<any>().mockReturnValue({
            orderBy: jest.fn<any>().mockReturnValue({
              limit: jest.fn<any>().mockReturnValue({
                offset: jest.fn<any>().mockResolvedValue(mockIncidents as any),
              }),
            }),
          }),
        }),
      });

      const res = await request(app).get(`/sync/shipments/${sampleShipmentId}/incidents`);

      expect(res.status).toBe(200);
      expect(res.body.shipmentId).toBe(sampleShipmentId);
      expect(res.body.count).toBe(1);
      expect(res.body.incidents[0].incidentType).toBe('ACCIDENT');
    });
  });
});
