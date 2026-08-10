import { pgTable, uuid, varchar, text, decimal, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const loadStatusEnum = pgEnum('load_status', [
  'POSTED',
  'MATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'EXPIRED',
  'CANCELLED',
]);

export const loads = pgTable('loads', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipperId: uuid('shipper_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  origin: jsonb('origin').notNull(), // { address, city, lat, lng }
  destination: jsonb('destination').notNull(), // { address, city, lat, lng }
  weightKg: decimal('weight_kg', { precision: 10, scale: 2 }).notNull(),
  volumeM3: decimal('volume_m3', { precision: 10, scale: 2 }),
  cargoType: varchar('cargo_type', { length: 100 }).notNull(),
  budgetAmount: decimal('budget_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('ETB'), // ETB, USD, EUR
  status: loadStatusEnum('status').notNull().default('POSTED'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
