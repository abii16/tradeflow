import { db } from '../db';
import { users } from '../db/schema/users';
import { vehicles } from '../db/schema/vehicles';
import { loads } from '../db/schema/loads';
import { bids } from '../db/schema/bids';
import { shipments } from '../db/schema/shipments';
import { payments } from '../db/schema/payments';
import { eq, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedCarrier() {
  console.log('Ensuring transporter live database data...');

  // 1. Find or verify transporter users
  const transporters = await db.select().from(users).where(eq(users.role, 'TRANSPORTER'));
  if (transporters.length === 0) {
    console.log('No transporters found to setup');
    process.exit(0);
  }

  for (const t of transporters) {
    await db.update(users).set({
      isVerified: true,
      verificationStatus: 'VERIFIED',
      tinNumber: t.tinNumber || '0049182371',
      tradeLicense: t.tradeLicense || 'TL-AA-2026-9812',
      companyName: t.companyName || 'Horn of Africa Heavy Freight PLC',
    }).where(eq(users.id, t.id));
  }

  const primaryTransporter = transporters[0];
  console.log(`Setting up fleet and active haul for transporter: ${primaryTransporter.email} (${primaryTransporter.id})`);

  // 2. Ensure real vehicles exist in vehicles table
  const existingVehicles = await db.select().from(vehicles).where(eq(vehicles.ownerId, primaryTransporter.id));
  if (existingVehicles.length === 0) {
    await db.insert(vehicles).values([
      {
        id: uuidv4(),
        ownerId: primaryTransporter.id,
        vehicleType: 'Scania R500 Flatbed Heavy Trailer',
        capacityTons: '40.00',
        fuelType: 'Diesel',
        insuranceDocUrl: 'https://tradeflow.et/docs/insurance_scania_01.pdf',
        roadworthinessDocUrl: 'https://tradeflow.et/docs/roadworthy_scania_01.pdf',
        isVerified: true,
      },
      {
        id: uuidv4(),
        ownerId: primaryTransporter.id,
        vehicleType: 'Sinotruk HOWO 371 40ft Container Carrier',
        capacityTons: '35.00',
        fuelType: 'Diesel',
        insuranceDocUrl: 'https://tradeflow.et/docs/insurance_howo_02.pdf',
        roadworthinessDocUrl: 'https://tradeflow.et/docs/roadworthy_howo_02.pdf',
        isVerified: true,
      },
      {
        id: uuidv4(),
        ownerId: primaryTransporter.id,
        vehicleType: 'Volvo FH16 750 Lowbed Transporter',
        capacityTons: '45.00',
        fuelType: 'Diesel',
        insuranceDocUrl: 'https://tradeflow.et/docs/insurance_volvo_03.pdf',
        roadworthinessDocUrl: 'https://tradeflow.et/docs/roadworthy_volvo_03.pdf',
        isVerified: true,
      }
    ]);
    console.log('Inserted 3 fleet trucks into vehicles table.');
  }

  // 3. Ensure there are active and posted loads
  const allLoads = await db.select().from(loads);
  let samplePostedLoad = allLoads.find(l => l.status === 'POSTED');

  if (!samplePostedLoad) {
    const [shipper] = await db.select().from(users).where(eq(users.role, 'SHIPPER')).limit(1);
    if (shipper) {
      const [newLoad] = await db.insert(loads).values({
        id: uuidv4(),
        shipperId: shipper.id,
        title: '38T Bulk Fertilizer & Agro Chemicals',
        description: 'Priority delivery from Djibouti Port Terminal 2 to Modjo Central Fertilizer Depot',
        origin: { city: 'Djibouti Port', address: 'Terminal 2, Doraleh', lat: 11.59, lng: 43.14 },
        destination: { city: 'Modjo', address: 'Modjo Dry Port Gate 3', lat: 8.59, lng: 39.12 },
        weightKg: '38000',
        volumeM3: '42.0',
        cargoType: 'Agriculture & Chemicals',
        budgetAmount: '365000',
        currency: 'ETB',
        status: 'POSTED',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      }).returning();
      samplePostedLoad = newLoad;
      console.log('Created sample posted load in DB.');
    }
  }

  // 4. Ensure an active shipment exists for primary transporter
  const existingShipments = await db.select().from(shipments).where(eq(shipments.transporterId, primaryTransporter.id));
  if (existingShipments.length === 0 && samplePostedLoad) {
    // Create bid
    const [acceptedBid] = await db.insert(bids).values({
      id: uuidv4(),
      loadId: samplePostedLoad.id,
      transporterId: primaryTransporter.id,
      bidAmount: '355000',
      currency: 'ETB',
      deliveryEta: new Date(Date.now() + 3 * 86400000),
      notes: 'Available immediately at Doraleh with Scania R500 trailer',
      status: 'ACCEPTED',
    }).returning();

    // Create active shipment
    const [newShipment] = await db.insert(shipments).values({
      id: uuidv4(),
      loadId: samplePostedLoad.id,
      acceptedBidId: acceptedBid.id,
      transporterId: primaryTransporter.id,
      driverId: primaryTransporter.id, // Transporter acting as lead driver
      status: 'IN_TRANSIT',
      currentLat: 11.432, // Near Mille / Semera
      currentLng: 40.805,
      estimatedFuelLiters: 285,
      actualFuelLiters: 195,
      pickupTime: new Date(Date.now() - 18 * 3600000), // picked up 18 hours ago
    }).returning();

    // Create escrow payment
    await db.insert(payments).values({
      id: uuidv4(),
      shipmentId: newShipment.id,
      payerId: samplePostedLoad.shipperId,
      payeeId: primaryTransporter.id,
      amount: '355000.00',
      amountInETB: '355000.00',
      currency: 'ETB',
      platformCommissionRate: '0.0500',
      platformCommissionAmount: '17750.00',
      netPayoutAmount: '337250.00',
      paymentMethod: 'TELEBIRR',
      outTradeNo: `TLB-ET-${Date.now()}`,
      idempotencyKey: `IDEMP-${Date.now()}`,
      status: 'ESCROW_HELD',
      payoutStatus: 'SCHEDULED',
      payoutScheduledAt: new Date(Date.now() + 2 * 86400000),
    });

    console.log('Created active in-transit shipment and TeleBirr escrow payment.');
  }

  console.log('Carrier live data setup completed successfully!');
  process.exit(0);
}

seedCarrier().catch(e => {
  console.error('Error seeding carrier live data:', e);
  process.exit(1);
});
