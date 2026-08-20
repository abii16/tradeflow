import { pgTable, uuid, varchar, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
export const riskZones = pgTable('risk_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // e.g., HIGH, CRITICAL, CAUTION
  zone: jsonb('zone').notNull(), // Stores GeoJSON polygon
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
