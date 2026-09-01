import { db } from './src/db';
import { users } from './src/db/schema/users';
import { shipments } from './src/db/schema/shipments';
import { loads } from './src/db/schema/loads';
import { bids } from './src/db/schema/bids';
import { disputes } from './src/db/schema/disputes';
import { eq } from 'drizzle-orm';

async function seedDisputes() {
  console.log('Seeding disputes test data...');

  try {
    // 1. Get a shipper and transporter
    const shippers = await db.select().from(users).where(eq(users.role, 'SHIPPER')).limit(1);
    const transporters = await db.select().from(users).where(eq(users.role, 'TRANSPORTER')).limit(1);

    if (shippers.length === 0 || transporters.length === 0) {
      throw new Error("Missing shipper or transporter. Please run seed_contracts.ts first.");
    }
    const shipper = shippers[0];
    const transporter = transporters[0];
    const driver = transporters[0];

    // 2. Get or create a shipment to dispute
    let shipmentData = await db.select().from(shipments).limit(2);
    if (shipmentData.length < 2) {
       // Need to create loads and bids first
       const insertedLoads = await db.insert(loads).values([
         { shipperId: shipper.id, title: 'Electronics Cargo', origin: 'Djibouti', destination: 'Addis Ababa', cargoType: 'Electronics', weightKg: '5000', budgetAmount: '160000' },
         { shipperId: shipper.id, title: 'Machinery Cargo', origin: 'Djibouti', destination: 'Semera', cargoType: 'Machinery', weightKg: '8000', budgetAmount: '250000' }
       ]).returning();

       const insertedBids = await db.insert(bids).values([
         { loadId: insertedLoads[0].id, transporterId: transporter.id, bidAmount: '150000', status: 'ACCEPTED' },
         { loadId: insertedLoads[1].id, transporterId: transporter.id, bidAmount: '220000', status: 'ACCEPTED' }
       ]).returning();

       const insertedShipments = await db.insert(shipments).values([
         {
           loadId: insertedLoads[0].id,
           acceptedBidId: insertedBids[0].id,
           transporterId: transporter.id,
           driverId: driver.id,
           status: 'IN_TRANSIT',
         },
         {
           loadId: insertedLoads[1].id,
           acceptedBidId: insertedBids[1].id,
           transporterId: transporter.id,
           driverId: driver.id,
           status: 'IN_TRANSIT',
         }
       ]).returning();
       shipmentData = insertedShipments;
    }

    // 3. Insert disputes
    await db.insert(disputes).values([
      {
        claimNumber: 'CLM-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        shipperId: shipper.id,
        transporterId: transporter.id,
        shipmentId: shipmentData[0].id,
        amountLocked: '150000', // ETB 150,000
        reason: 'Cargo arrived damaged, negotiating refund amount.',
        status: 'OPEN',
      },
      {
        claimNumber: 'CLM-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        shipperId: shipper.id,
        transporterId: transporter.id,
        shipmentId: shipmentData[1].id,
        amountLocked: '50000', // Partial lock
        reason: 'Delayed transit violation exceeding 24h grace period.',
        status: 'UNDER_REVIEW',
      }
    ]);

    console.log('Disputes test data seeded successfully.');
  } catch (error) {
    console.error('Error seeding disputes data:', error);
  }
}

seedDisputes().catch(console.error).finally(() => process.exit(0));
