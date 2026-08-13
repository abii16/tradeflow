import { pgTable, uuid, timestamp, varchar, numeric } from 'drizzle-orm/pg-core';
import { users } from './users';
import { vehicles } from './vehicles';
import { riskZones } from './risk_zones';

export const driverGeofenceLogs = pgTable('driver_geofence_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  riskZoneId: uuid('risk_zone_id').references(() => riskZones.id, { onDelete: 'cascade' }).notNull(),
  eventType: varchar('event_type', { length: 20 }).notNull(), // ENTRY, EXIT
  latitude: numeric('latitude', { precision: 10, scale: 6 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 6 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
