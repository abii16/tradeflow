import { pgTable, uuid, varchar, text, decimal, integer, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
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
  'ESCROW_HELD',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'DISPUTED',
  'RETRYING',
]);

export const payoutStatusEnum = pgEnum('payout_status', [
  'UNSCHEDULED',
  'SCHEDULED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED_REFUND',
  'RESOLVED_PAYOUT',
  'REJECTED',
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
  platformCommissionRate: decimal('platform_commission_rate', { precision: 5, scale: 4 }).notNull().default('0.0500'), // 5% default
  platformCommissionAmount: decimal('platform_commission_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  netPayoutAmount: decimal('net_payout_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('TELEBIRR'),
  telebirrTxnId: varchar('telebirr_txn_id', { length: 255 }).unique(),
  outTradeNo: varchar('out_trade_no', { length: 255 }).unique().notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique().notNull(),
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  payoutStatus: payoutStatusEnum('payout_status').notNull().default('UNSCHEDULED'),
  payoutScheduledAt: timestamp('payout_scheduled_at'),
  payoutCompletedAt: timestamp('payout_completed_at'),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  nextRetryAt: timestamp('next_retry_at'),
  lastErrorReason: text('last_error_reason'),
  rawWebhookPayload: jsonb('raw_webhook_payload'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentDisputes = pgTable('payment_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  raisedById: uuid('raised_by_id').notNull().references(() => users.id),
  reason: text('reason').notNull(),
  evidenceUrl: varchar('evidence_url', { length: 500 }),
  status: disputeStatusEnum('status').notNull().default('OPEN'),
  resolutionNotes: text('resolution_notes'),
  resolvedById: uuid('resolved_by_id').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentAuditLogs = pgTable('payment_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  statusBefore: varchar('status_before', { length: 50 }),
  statusAfter: varchar('status_after', { length: 50 }),
  details: jsonb('details'),
  performedById: uuid('performed_by_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
