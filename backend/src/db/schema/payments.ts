import { pgTable, uuid, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { shipments } from './shipments';

export const paymentMethodEnum = pgEnum('payment_method', [
  'TELEBIRR',
  'BANK_TRANSFER',
  'CASH',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  payerId: uuid('payer_id').notNull().references(() => users.id),
  payeeId: uuid('payee_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('ETB'), // ETB, USD, EUR
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).notNull().default('1.0000'),
  amountInETB: decimal('amount_in_etb', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('TELEBIRR'),
  telebirrTxnId: varchar('telebirr_txn_id', { length: 255 }).unique(),
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
