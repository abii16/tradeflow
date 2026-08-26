import { pgTable, uuid, doublePrecision, integer, timestamp, varchar } from 'drizzle-orm/pg-core';
import { shipments } from './shipments';

export const telemetryLogs = pgTable('telemetry_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  speed: integer('speed').default(0),
  status: varchar('status', { length: 50 }).default('SAFE'),
  eta: varchar('eta', { length: 50 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});
