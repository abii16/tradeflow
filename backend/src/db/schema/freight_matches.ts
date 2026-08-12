import { pgTable, uuid, boolean, decimal, timestamp } from 'drizzle-orm/pg-core';

export const freightMatches = pgTable('freight_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  requiredWeightTons: decimal('required_weight_tons', { precision: 10, scale: 2 }).notNull(),
  transporterCapacityTons: decimal('transporter_capacity_tons', { precision: 10, scale: 2 }).notNull(),
  tripDistanceKm: decimal('trip_distance_km', { precision: 10, scale: 2 }).notNull(),
  proximityDistanceKm: decimal('proximity_distance_km', { precision: 10, scale: 2 }).notNull(),
  proposedCostEtb: decimal('proposed_cost_etb', { precision: 12, scale: 2 }).notNull(),
  historicalReliabilityScore: decimal('historical_reliability_score', { precision: 3, scale: 2 }).notNull(),
  fuelEfficiencyScore: decimal('fuel_efficiency_score', { precision: 3, scale: 2 }).notNull(),
  matchAccepted: boolean('match_accepted').notNull(),
  isTrained: boolean('is_trained').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
