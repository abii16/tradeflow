import { db } from './index';
import { users, loads, bids, shipments, contracts } from './schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from 'argon2';

async function seed() {
  console.log('Seeding data...');

  // 1. Get or Create a Shipper
  let shipperId = '';
  const existingShipper = await db.query.users.findFirst({ where: eq(users.role, 'SHIPPER') });
  if (existingShipper) {
    shipperId = existingShipper.id;
  } else {
    shipperId = uuidv4();
    await db.insert(users).values({
      id: shipperId,
      email: 'shipper_seed@test.com',
      fullName: 'John Shipper',
      phone: '+251911123456',
      role: 'SHIPPER',
      companyName: 'Test Shipper Logistics',
      isVerified: true
    });
  }

  // 2. Get or Create a Forwarder
  let forwarderId = '';
  const existingForwarder = await db.query.users.findFirst({ where: eq(users.role, 'FORWARDER') });
  if (existingForwarder) {
    forwarderId = existingForwarder.id;
  } else {
    forwarderId = uuidv4();
    await db.insert(users).values({
      id: forwarderId,
      email: 'forwarder_seed@test.com',
      fullName: 'Alice Forwarder',
      phone: '+251911123457',
      role: 'FORWARDER',
      companyName: 'Ethio Forwarding PLC',
      isVerified: true
    });
  }

  // 3. Get or Create a Transporter
  let transporterId = '';
  const existingTransporter = await db.query.users.findFirst({ where: eq(users.role, 'TRANSPORTER') });
  if (existingTransporter) {
    transporterId = existingTransporter.id;
  } else {
    transporterId = uuidv4();
    await db.insert(users).values({
      id: transporterId,
      email: 'transporter_seed@test.com',
      fullName: 'Bob Transporter',
      phone: '+251911123458',
      role: 'TRANSPORTER',
      companyName: 'TransHorn Logistics',
      isVerified: true
    });
  }

  // 4. Create Loads (some linked to shipper, some to forwarder so they show up)
  const openLoadId = uuidv4();
  await db.insert(loads).values({
    id: openLoadId,
    shipperId: shipperId,
    title: '40T Structural Steel',
    description: 'Djibouti to Dire Dawa structural steel delivery',
    origin: { address: 'Djibouti Port', city: 'Djibouti', lat: 11.6, lng: 43.1 },
    destination: { address: 'Dire Dawa', city: 'Dire Dawa', lat: 9.6, lng: 41.8 },
    weightKg: "40000",
    cargoType: 'Steel',
    budgetAmount: "340000",
    currency: 'ETB',
    status: 'POSTED',
    expiresAt: new Date(Date.now() + 86400000)
  });

  const transitLoadId = uuidv4();
  await db.insert(loads).values({
    id: transitLoadId,
    shipperId: forwarderId, // to show in forwarder workspace
    title: '25T Coffee Beans',
    description: 'Modjo to Djibouti Export',
    origin: { address: 'Modjo Dry Port', city: 'Modjo', lat: 8.6, lng: 39.1 },
    destination: { address: 'Djibouti Port', city: 'Djibouti', lat: 11.6, lng: 43.1 },
    weightKg: "25000",
    cargoType: 'Coffee',
    budgetAmount: "285000",
    currency: 'ETB',
    status: 'IN_TRANSIT',
    expiresAt: new Date(Date.now() + 86400000)
  });

  // 5. Create Bids for Open Load
  const bidId = uuidv4();
  await db.insert(bids).values({
    id: bidId,
    loadId: openLoadId,
    transporterId: transporterId,
    bidAmount: "340000",
    currency: 'ETB',
    status: 'PENDING',
    deliveryEta: new Date(Date.now() + 48 * 3600 * 1000)
  });

  // 5.5 Create Accepted Bid for Transit Load
  const acceptedBidId = uuidv4();
  await db.insert(bids).values({
    id: acceptedBidId,
    loadId: transitLoadId,
    transporterId: transporterId,
    bidAmount: "280000",
    currency: 'ETB',
    status: 'ACCEPTED',
    deliveryEta: new Date(Date.now() + 48 * 3600 * 1000)
  });

  // 6. Create Active Shipment for Transit Load
  await db.insert(shipments).values({
    id: uuidv4(),
    loadId: transitLoadId,
    acceptedBidId: acceptedBidId,
    transporterId: transporterId,
    driverId: transporterId, // using transporter as driver
    status: 'IN_TRANSIT',
    currentLat: 8.9833,
    currentLng: 40.1667
  });

  // 7. Create Contract Rates
  await db.insert(contracts).values({
    id: uuidv4(),
    shipperId: shipperId,
    transporterId: transporterId,
    origin: 'Djibouti Port',
    destination: 'Modjo Dry Port',
    lockedRate: "345000",
    status: 'ACTIVE',
    validUntil: new Date('2026-12-31')
  });

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
