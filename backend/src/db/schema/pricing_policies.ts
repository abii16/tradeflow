import { pgTable, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const pricingPolicies = pgTable('pricing_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  spotRateFloor: numeric('spot_rate_floor', { precision: 5, scale: 2 }).notNull().default('0.00'), 
  spotRateCeiling: numeric('spot_rate_ceiling', { precision: 5, scale: 2 }).notNull().default('0.00'),
  dieselPrice: numeric('diesel_price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  demandMultiplier: numeric('demand_multiplier', { precision: 5, scale: 2 }).notNull().default('1.00'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
