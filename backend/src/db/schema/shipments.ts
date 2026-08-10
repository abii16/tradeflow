import { pgTable, uuid, varchar, doublePrecision, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { loads } from './loads';
import { bids } from './bids';

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'DISPATCHED',
  'PICKED_UP',
  'IN_CUSTOMS',
  'IN_TRANSIT',
  'DELIVERED',
]);

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  loadId: uuid('load_id').notNull().unique().references(() => loads.id, { onDelete: 'cascade' }),
  acceptedBidId: uuid('accepted_bid_id').notNull().references(() => bids.id),
  transporterId: uuid('transporter_id').notNull().references(() => users.id),
  driverId: uuid('driver_id').notNull().references(() => users.id),
  currentLat: doublePrecision('current_lat'),
  currentLng: doublePrecision('current_lng'),
  status: shipmentStatusEnum('status').notNull().default('DISPATCHED'),
  podPhotoUrl: varchar('pod_photo_url', { length: 500 }),
  podSignatureUrl: varchar('pod_signature_url', { length: 500 }),
  pickupTime: timestamp('pickup_time'),
  deliveryTime: timestamp('delivery_time'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
