import { pgTable, uuid, varchar, timestamp, numeric } from 'drizzle-orm/pg-core';
import { users } from './users';
import { shipments } from './shipments';

export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }),
  reporterId: uuid('reporter_id').references(() => users.id),
  incidentType: varchar('incident_type', { length: 50 }).notNull(), // ACCIDENT, CHECKPOINT, FUEL_OUTAGE
  latitude: numeric('latitude', { precision: 10, scale: 6 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 6 }).notNull(),
  severity: varchar('severity', { length: 20 }), // LOW, MEDIUM, HIGH, CRITICAL
  notes: varchar('notes', { length: 255 }),
  reportedAt: timestamp('reported_at').notNull(), // NFR 5.2: Authoritative timestamp from device
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

