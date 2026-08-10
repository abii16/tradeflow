import { pgTable, uuid, varchar, text, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { loads } from './loads';

export const bidStatusEnum = pgEnum('bid_status', [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
]);

export const bids = pgTable('bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  loadId: uuid('load_id').notNull().references(() => loads.id, { onDelete: 'cascade' }),
  transporterId: uuid('transporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bidAmount: decimal('bid_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('ETB'),
  deliveryEta: timestamp('delivery_eta'),
  notes: text('notes'),
  status: bidStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
