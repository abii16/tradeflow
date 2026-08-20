import { pgTable, uuid, varchar, boolean, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'SHIPPER',
  'TRANSPORTER',
  'FORWARDER',
  'CUSTOMS_OFFICER',
  'ADMIN',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'UNVERIFIED',
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  role: userRoleEnum('role').notNull().default('SHIPPER'),
  companyName: varchar('company_name', { length: 255 }),
  tinNumber: varchar('tin_number', { length: 50 }),
  tradeLicense: varchar('trade_license', { length: 100 }),
  badgeId: varchar('badge_id', { length: 50 }),
  isVerified: boolean('is_verified').notNull().default(false),
  verificationStatus: verificationStatusEnum('verification_status').notNull().default('UNVERIFIED'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
