import { db } from './src/db';
import { users } from './src/db/schema/users';
import { loads } from './src/db/schema/loads';
import { bids } from './src/db/schema/bids';
import { shipments } from './src/db/schema/shipments';
import { eq, desc } from 'drizzle-orm';

async function run() {
  try {
    const shippers = await db.select().from(users).where(eq(users.email, 'ship@gmail.com')).limit(1);
    if (!shippers.length) {
      console.log('No shipper found for ship@gmail.com');
      process.exit(1);
    }
    const shipper = shippers[0];
    
    // Get a transporter
    const transporters = await db.select().from(users).where(eq(users.role, 'TRANSPORTER')).limit(1);
    if (!transporters.length) {
      console.log('No transporters found');
      process.exit(1);
    }
    const transporter = transporters[0];

    // Create a new load for this specific user
    const [load] = await db.insert(loads).values({
      shipperId: shipper.id,
      title: '30T Construction Rebar (Flatbed)',
      description: 'Deliver 30T Construction Rebar (Flatbed) from Djibouti Port to Modjo Dry Port',
      origin: { address: 'Djibouti Port / Doraleh Container Terminal (DCT)', city: 'Djibouti' },
      destination: { address: 'Modjo Dry Port & Terminal, Ethiopia', city: 'Modjo' },
      weightKg: '32000',
      cargoType: '30T Construction Rebar (Flatbed)',
      budgetAmount: '92400',
      currency: 'ETB',
      status: 'MATCHED'
    }).returning();
    console.log('Created load', load.id);

    // Create a bid
    const [bid] = await db.insert(bids).values({
      loadId: load.id,
      transporterId: transporter.id,
      bidAmount: '92000',
      currency: 'ETB',
      status: 'ACCEPTED',
      deliveryEta: new Date(Date.now() + 86400000)
    }).returning();
    console.log('Created bid', bid.id);

    // Create shipment
    await db.insert(shipments).values({
      loadId: load.id,
      acceptedBidId: bid.id,
      transporterId: transporter.id,
      driverId: transporter.id, // Mock driver
      status: 'IN_TRANSIT',
      trackingNumber: `SHP-${Date.now().toString().substring(0,8)}-DJM`
    });

    console.log('Seed successful! An IN_TRANSIT shipment has been created for ship@gmail.com.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
