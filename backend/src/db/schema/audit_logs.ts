import { pgTable, uuid, timestamp, varchar, json, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action', { length: 255 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  userRole: varchar('user_role', { length: 50 }),
  method: varchar('method', { length: 10 }).notNull(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  statusCode: integer('status_code').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  requestPayload: json('request_payload'),
  responsePayload: json('response_payload'),
  recordHash: varchar('record_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
