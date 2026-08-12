import { pgTable, uuid, varchar, boolean, decimal, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  vehicleType: varchar('vehicle_type', { length: 100 }).notNull(),
  capacityTons: decimal('capacity_tons', { precision: 10, scale: 2 }).notNull(),
  fuelType: varchar('fuel_type', { length: 50 }),
  insuranceDocUrl: varchar('insurance_doc_url', { length: 2048 }),
  roadworthinessDocUrl: varchar('roadworthiness_doc_url', { length: 2048 }),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
