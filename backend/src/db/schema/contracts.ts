import { pgTable, uuid, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipperId: uuid('shipper_id').references(() => users.id).notNull(),
  transporterId: uuid('transporter_id').references(() => users.id).notNull(),
  origin: varchar('origin', { length: 255 }).notNull(),
  destination: varchar('destination', { length: 255 }).notNull(),
  lockedRate: numeric('locked_rate', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // e.g., ACTIVE, REVIEW_REQUIRED, EXPIRED
  validUntil: timestamp('valid_until').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
