import { pgTable, uuid, varchar, text, doublePrecision, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { shipments } from './shipments';

/**
 * driver_check_ins table:
 * Stores individual offline telemetry pings, waypoint check-ins,
 * status transitions, and Proof-of-Delivery timestamps queued by driver mobile app.
 */
export const driverCheckIns = pgTable('driver_check_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id')
    .notNull()
    .references(() => shipments.id, { onDelete: 'cascade' }),
  driverId: uuid('driver_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  clientRecordId: varchar('client_record_id', { length: 128 }).notNull().unique(),
  eventType: varchar('event_type', { length: 50 }).notNull().default('GPS_PING'),
  status: varchar('status', { length: 50 }),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  altitude: doublePrecision('altitude'),
  speedKmH: doublePrecision('speed_km_h'),
  heading: doublePrecision('heading'),
  accuracy: doublePrecision('accuracy'),
  odometerKm: doublePrecision('odometer_km'),
  batteryLevel: doublePrecision('battery_level'),
  locationName: varchar('location_name', { length: 255 }),
  notes: text('notes'),
  podPhotoUrl: varchar('pod_photo_url', { length: 500 }),
  podSignatureUrl: varchar('pod_signature_url', { length: 500 }),
  metadata: jsonb('metadata'),
  clientTimestamp: timestamp('client_timestamp').notNull(),
  syncedAt: timestamp('synced_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * incident_reports table:
 * Stores geotagged incidents reported by drivers during corridor transit
 * (e.g. accidents, checkpoint delays, fuel shortages, road blockages).
 */
export const incidentReports = pgTable('incident_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id')
    .references(() => shipments.id, { onDelete: 'set null' }),
  driverId: uuid('driver_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  clientRecordId: varchar('client_record_id', { length: 128 }).unique(),
  incidentType: varchar('incident_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull().default('MEDIUM'),
  description: text('description').notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  locationName: varchar('location_name', { length: 255 }),
  mediaUrls: jsonb('media_urls'),
  status: varchar('status', { length: 50 }).notNull().default('REPORTED'),
  clientTimestamp: timestamp('client_timestamp').notNull(),
  syncedAt: timestamp('synced_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * sync_batches table:
 * Tracks offline sync batch transactions for replay protection, idempotency,
 * and corridor auditability.
 */
export const syncBatches = pgTable('sync_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: varchar('batch_id', { length: 128 }).notNull().unique(),
  driverId: uuid('driver_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  deviceInfo: jsonb('device_info'),
  totalItems: integer('total_items').notNull().default(0),
  processedCount: integer('processed_count').notNull().default(0),
  duplicateCount: integer('duplicate_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('COMPLETED'),
  summary: jsonb('summary'),
  clientTimestamp: timestamp('client_timestamp').notNull(),
  syncedAt: timestamp('synced_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
