import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { loads } from './loads';

export const customsDocuments = pgTable('customs_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  loadId: uuid('load_id').notNull().references(() => loads.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  invoiceUrl: varchar('invoice_url', { length: 500 }).notNull(),
  packingListUrl: varchar('packing_list_url', { length: 500 }).notNull(),
  extractedData: jsonb('extracted_data').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
