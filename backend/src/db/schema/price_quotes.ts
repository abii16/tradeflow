import { pgTable, uuid, varchar, decimal, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { loads } from './loads';

export const priceQuotes = pgTable('price_quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  calculationId: varchar('calculation_id', { length: 50 }).notNull().unique(),
  shipperId: uuid('shipper_id').references(() => users.id, { onDelete: 'set null' }),
  loadId: uuid('load_id').references(() => loads.id, { onDelete: 'set null' }),
  corridor: varchar('corridor', { length: 100 }),
  origin: jsonb('origin').notNull(), // { city, address, lat, lng }
  destination: jsonb('destination').notNull(), // { city, address, lat, lng }
  cargoType: varchar('cargo_type', { length: 50 }).notNull().default('dry'),
  weightKg: decimal('weight_kg', { precision: 10, scale: 2 }).notNull(),
  distanceKm: decimal('distance_km', { precision: 8, scale: 2 }).notNull(),
  spotPrice: decimal('spot_price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('ETB'),
  ratePerKg: decimal('rate_per_kg', { precision: 10, scale: 4 }).notNull(),
  ratePerTonKm: decimal('rate_per_ton_km', { precision: 10, scale: 4 }).notNull(),
  breakdown: jsonb('breakdown').notNull(), // Full audit snapshot of multipliers and inputs
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
