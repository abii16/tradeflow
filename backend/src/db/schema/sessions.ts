import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
  device: varchar('device', { length: 255 }).notNull().default('Desktop Web Browser'),
  browser: varchar('browser', { length: 100 }),
  os: varchar('os', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 50 }).notNull().default('127.0.0.1'),
  location: varchar('location', { length: 255 }).default('Addis Ababa, Ethiopia'),
  isSuspicious: boolean('is_suspicious').notNull().default(false),
  suspiciousReason: varchar('suspicious_reason', { length: 255 }),
  lastActive: timestamp('last_active').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});
