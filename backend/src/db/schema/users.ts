import { pgTable, uuid, varchar, boolean, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'SHIPPER',
  'TRANSPORTER',
  'DRIVER',
  'CUSTOMS_BROKER',
  'FINANCE_ADMIN',
  'SYSTEM_ADMIN',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  role: userRoleEnum('role').notNull().default('SHIPPER'),
  isVerified: boolean('is_verified').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
