import { pgTable, uuid, varchar, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { shipments } from './shipments';
import { disputeStatusEnum } from './payments';

// Exporting table

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  claimNumber: varchar('claim_number', { length: 50 }).notNull().unique(),
  shipperId: uuid('shipper_id').references(() => users.id).notNull(),
  transporterId: uuid('transporter_id').references(() => users.id).notNull(),
  shipmentId: uuid('shipment_id').references(() => shipments.id).notNull(),
  amountLocked: numeric('amount_locked', { precision: 12, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 500 }).notNull(),
  status: disputeStatusEnum('status').notNull().default('OPEN'),
  evidenceThread: jsonb('evidence_thread'),
  resolutionNotes: varchar('resolution_notes', { length: 1000 }),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});
