import { pgTable, uuid, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users, verificationStatusEnum } from './users';

export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tradeLicenseNumber: varchar('trade_license_number', { length: 100 }),
  taxId: varchar('tax_id', { length: 100 }),
  documentUrls: jsonb('document_urls'), // e.g. { "tradeLicense": "url", "idCard": "url" }
  status: verificationStatusEnum('status').notNull().default('PENDING'),
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
