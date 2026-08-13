import { z } from 'zod';

export const CheckInEventTypeEnum = z.enum([
  'GPS_PING',
  'WAYPOINT_CHECKIN',
  'STATUS_UPDATE',
  'REST_STOP',
  'FUEL_STOP',
  'CUSTOMS_CHECKPOINT',
  'DELIVERY_POD',
]);

export const ShipmentStatusEnum = z.enum([
  'DISPATCHED',
  'PICKED_UP',
  'IN_CUSTOMS',
  'IN_TRANSIT',
  'DELIVERED',
]);

export const IncidentTypeEnum = z.enum([
  'ACCIDENT',
  'CHECKPOINT_DELAY',
  'FUEL_UNAVAILABILITY',
  'ROAD_BLOCKAGE',
  'CONFLICT_RISK',
  'MECHANICAL_BREAKDOWN',
  'WEATHER_DELAY',
  'OTHER',
]);

export const IncidentSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

/**
 * Schema for an individual queued driver check-in / GPS telemetry event
 */
export const CheckInItemSchema = z.object({
  clientRecordId: z.string().min(1, 'clientRecordId is required for deduplication'),
  shipmentId: z.string().uuid('Invalid shipment ID format'),
  eventType: CheckInEventTypeEnum.default('GPS_PING'),
  status: ShipmentStatusEnum.optional(),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  altitude: z.number().optional(),
  speedKmH: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  odometerKm: z.number().min(0).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  locationName: z.string().max(255).optional(),
  notes: z.string().optional(),
  podPhotoUrl: z.string().max(500).optional(),
  podSignatureUrl: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
  clientTimestamp: z
    .union([z.string(), z.date()])
    .transform((val) => (val instanceof Date ? val : new Date(val)))
    .refine((d) => !isNaN(d.getTime()), 'Invalid client timestamp'),
});

export type CheckInItemDto = z.infer<typeof CheckInItemSchema>;

/**
 * Schema for an individual driver incident report
 */
export const IncidentItemSchema = z.object({
  clientRecordId: z.string().min(1, 'clientRecordId is required for deduplication'),
  shipmentId: z.string().uuid('Invalid shipment ID format').optional().nullable(),
  incidentType: IncidentTypeEnum,
  severity: IncidentSeverityEnum.default('MEDIUM'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().max(255).optional(),
  mediaUrls: z.array(z.string()).optional(),
  clientTimestamp: z
    .union([z.string(), z.date()])
    .transform((val) => (val instanceof Date ? val : new Date(val)))
    .refine((d) => !isNaN(d.getTime()), 'Invalid client timestamp'),
});

export type IncidentItemDto = z.infer<typeof IncidentItemSchema>;

/**
 * Schema for Device Information metadata sent during sync
 */
export const DeviceInfoSchema = z.object({
  appVersion: z.string().optional(),
  os: z.string().optional(),
  platform: z.string().optional(),
  batteryLevel: z.number().optional(),
  networkType: z.string().optional(),
  deviceId: z.string().optional(),
});

export type DeviceInfoDto = z.infer<typeof DeviceInfoSchema>;

/**
 * Schema for Offline Sync Batch Request Payload
 */
export const SyncBatchRequestSchema = z.object({
  batchId: z.string().min(1, 'batchId is required for idempotent sync execution'),
  deviceInfo: DeviceInfoSchema.optional(),
  checkIns: z.array(CheckInItemSchema).default([]),
  incidents: z.array(IncidentItemSchema).default([]),
  clientTimestamp: z
    .union([z.string(), z.date()])
    .transform((val) => (val instanceof Date ? val : new Date(val)))
    .refine((d) => !isNaN(d.getTime()), 'Invalid client timestamp'),
});

export type SyncBatchRequestDto = z.infer<typeof SyncBatchRequestSchema>;

/**
 * Schema for querying tracking history / trail
 */
export const QueryTrailSchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0),
  since: z.string().optional(),
  eventType: z.string().optional(),
});

export type QueryTrailDto = z.infer<typeof QueryTrailSchema>;

/**
 * Schema for querying logged incidents
 */
export const QueryIncidentsSchema = z.object({
  severity: IncidentSeverityEnum.optional(),
  incidentType: IncidentTypeEnum.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type QueryIncidentsDto = z.infer<typeof QueryIncidentsSchema>;
