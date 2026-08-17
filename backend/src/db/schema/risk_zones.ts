import { pgTable, uuid, varchar, timestamp, boolean, customType } from 'drizzle-orm/pg-core';

const geometry = customType<{ data: string; driverData: string, config: { type: string, srid: number } }>({
  dataType(config) {
    return `geometry(${config?.type || 'polygon'}, ${config?.srid || 4326})`;
  }
});
export const riskZones = pgTable('risk_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // e.g., HIGH, CRITICAL, CAUTION
  zone: geometry('zone', { type: 'polygon', srid: 4326 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
