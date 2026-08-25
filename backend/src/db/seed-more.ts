import { db } from './index';
import { users, shipments, payments, paymentDisputes } from './schema';
import { eq, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedMore() {
  console.log('Seeding more data...');

  // Get Shipper and Transporter
  const shipper = await db.query.users.findFirst({ where: eq(users.role, 'SHIPPER') });
  const transporter = await db.query.users.findFirst({ where: eq(users.email, 'trans@gmail.com') });

  if (!shipper || !transporter) {
    console.error('Missing Shipper or Transporter. Run the first seed script.');
    process.exit(1);
  }

  // Get an active shipment
  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.transporterId, transporter.id)
  });

  if (!shipment) {
    console.error('No shipment found.');
    process.exit(1);
  }

  // Insert a payment
  const paymentId = uuidv4();
  await db.insert(payments).values({
    id: paymentId,
    shipmentId: shipment.id,
    payerId: shipper.id,
    payeeId: transporter.id,
    amount: "150000",
    currency: "ETB",
    amountInETB: "150000",
    platformCommissionAmount: "7500", // 5%
    netPayoutAmount: "142500",
    paymentMethod: "TELEBIRR",
    outTradeNo: "TRX-NEW-" + Date.now(),
    idempotencyKey: "IDEMP-NEW-" + Date.now(),
    status: "COMPLETED",
    payoutStatus: "COMPLETED",
    payoutCompletedAt: new Date(),
    createdAt: new Date(Date.now() - 1 * 86400000) // 1 day ago
  });

  const paymentId2 = uuidv4();
  await db.insert(payments).values({
    id: paymentId2,
    shipmentId: shipment.id,
    payerId: shipper.id,
    payeeId: transporter.id,
    amount: "60000",
    currency: "ETB",
    amountInETB: "60000",
    platformCommissionAmount: "3000", 
    netPayoutAmount: "57000",
    paymentMethod: "TELEBIRR",
    outTradeNo: "TRX-NEW-2-" + Date.now(),
    idempotencyKey: "IDEMP-NEW-2-" + Date.now(),
    status: "ESCROW_HELD",
    payoutStatus: "SCHEDULED", // Making it scheduled to appear in pending
  });

  // Insert a dispute
  const disputeId = uuidv4();
  await db.insert(paymentDisputes).values({
    id: disputeId,
    paymentId: paymentId2,
    shipmentId: shipment.id,
    raisedById: shipper.id,
    reason: "Cargo arrived damaged, negotiating refund amount.",
    status: "OPEN",
    createdAt: new Date(),
  });

  console.log('More data seeded successfully!');
  process.exit(0);
}

seedMore().catch(err => {
  console.error('Seeding more failed:', err);
  process.exit(1);
});
