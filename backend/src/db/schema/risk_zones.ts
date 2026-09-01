import { pgTable, uuid, varchar, timestamp, boolean, jsonb, doublePrecision } from 'drizzle-orm/pg-core';

export const riskZones = pgTable('risk_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }), // Added for Incident Type
  description: varchar('description', { length: 1000 }), // Added for Broadcast Message
  severity: varchar('severity', { length: 20 }).notNull(), // e.g., HIGH, CRITICAL, CAUTION
  latitude: doublePrecision('latitude'), // Added for direct mapping
  longitude: doublePrecision('longitude'), // Added for direct mapping
  radiusKm: doublePrecision('radius_km'), // Added for direct mapping
  zone: jsonb('zone').notNull(), // Stores GeoJSON polygon
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
