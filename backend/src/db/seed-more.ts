import { db } from './index';
import { users, shipments, payments, paymentDisputes } from './schema';
import { eq, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedMore() {
  console.log('Seeding more data...');

  // Get Shipper and Transporter
  const shipper = await db.query.users.findFirst({ where: eq(users.role, 'SHIPPER') });
  const transporter = await db.query.users.findFirst({ where: eq(users.role, 'TRANSPORTER') });

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
    amount: "280000",
    currency: "ETB",
    amountInETB: "280000",
    platformCommissionAmount: "14000", // 5%
    netPayoutAmount: "266000",
    paymentMethod: "TELEBIRR",
    outTradeNo: "TRX-" + Date.now(),
    idempotencyKey: "IDEMP-" + Date.now(),
    status: "COMPLETED",
    payoutStatus: "COMPLETED",
    payoutCompletedAt: new Date(),
    createdAt: new Date(Date.now() - 2 * 86400000) // 2 days ago
  });

  const paymentId2 = uuidv4();
  await db.insert(payments).values({
    id: paymentId2,
    shipmentId: shipment.id,
    payerId: shipper.id,
    payeeId: transporter.id,
    amount: "45000",
    currency: "ETB",
    amountInETB: "45000",
    platformCommissionAmount: "2250", 
    netPayoutAmount: "42750",
    paymentMethod: "TELEBIRR",
    outTradeNo: "TRX-2-" + Date.now(),
    idempotencyKey: "IDEMP-2-" + Date.now(),
    status: "ESCROW_HELD",
    payoutStatus: "UNSCHEDULED",
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
