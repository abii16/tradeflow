import { db } from './src/db/index.js';
import { shipments } from './src/db/schema/shipments.js';
import { users } from './src/db/schema/users.js';
import { loads } from './src/db/schema/loads.js';
import { bids } from './src/db/schema/bids.js';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    let allShipments = await db.select().from(shipments);
    if (allShipments.length === 0) {
      console.log('No shipments found. Creating a mock shipment for analytics...');
      
      let shipper = await db.query.users.findFirst({ where: eq(users.role, 'SHIPPER') });
      let driver = await db.query.users.findFirst({ where: eq(users.role, 'TRANSPORTER') });

      const [newLoad] = await db.insert(loads).values({
        shipperId: shipper.id,
        origin: 'Djibouti',
        destination: 'Modjo',
        cargoType: 'Containers',
        weightTons: '24',
        volumeCbm: '0',
        status: 'ASSIGNED',
        pickupWindowStart: new Date(),
        pickupWindowEnd: new Date()
      }).returning();

      const [newBid] = await db.insert(bids).values({
        loadId: newLoad.id,
        transporterId: driver.id,
        bidAmount: '150000',
        status: 'ACCEPTED'
      }).returning();

      await db.insert(shipments).values({
        loadId: newLoad.id,
        acceptedBidId: newBid.id,
        transporterId: driver.id,
        driverId: driver.id,
        status: 'IN_TRANSIT',
        estimatedFuelLiters: 200,
        actualFuelLiters: 235,
        fuelRecommendations: [
          "Reduce highway speeding above 80km/h on Galafi segment.",
          "Shift refueling to Awash station to minimize detour time."
        ]
      });
      allShipments = await db.select().from(shipments);
    } else {
      console.log('Updating existing shipments with fuel data...');
      // Update first shipment to be FLAGGED
      await db.update(shipments).set({
        estimatedFuelLiters: 200,
        actualFuelLiters: 235, // 17.5% variance
        fuelRecommendations: [
          "Excessive idling detected near checkpoints.",
          "Avoid aggressive acceleration in mountainous terrain."
        ]
      }).where(eq(shipments.id, allShipments[0].id));

      if (allShipments.length > 1) {
        // Update second shipment to be NORMAL/EFFICIENT
        await db.update(shipments).set({
          estimatedFuelLiters: 350,
          actualFuelLiters: 345, // -1.4% variance
          fuelRecommendations: [
            "Maintain current optimal cruising speed."
          ]
        }).where(eq(shipments.id, allShipments[1].id));
      }
    }
    console.log('Fuel analytics seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
