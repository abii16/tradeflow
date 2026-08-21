import { db } from './index';
import { users, user_profiles, loads, bids, shipments, contracts } from './schema';
import { eq, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('Seeding Shipper data...');

  // 1. Get or Create a Shipper
  let shipperId = '';
  const existingShipper = await db.query.users.findFirst({ where: eq(users.role, 'SHIPPER') });
  
  if (existingShipper) {
    shipperId = existingShipper.id;
    console.log(`Found Shipper: ${existingShipper.email}`);
  } else {
    shipperId = uuidv4();
    await db.insert(users).values({
      id: shipperId,
      email: 'shipper@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'SHIPPER',
      status: 'ACTIVE'
    });
    await db.insert(user_profiles).values({
      id: uuidv4(),
      userId: shipperId,
      companyName: 'Test Shipper Logistics',
    });
    console.log(`Created Shipper: shipper@test.com`);
  }

  // 2. Get or Create a Transporter
  let transporterId = '';
  const existingTransporter = await db.query.users.findFirst({ where: eq(users.role, 'TRANSPORTER') });
  
  if (existingTransporter) {
    transporterId = existingTransporter.id;
    console.log(`Found Transporter: ${existingTransporter.email}`);
  } else {
    transporterId = uuidv4();
    await db.insert(users).values({
      id: transporterId,
      email: 'transporter@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'TRANSPORTER',
      status: 'ACTIVE'
    });
    await db.insert(user_profiles).values({
      id: uuidv4(),
      userId: transporterId,
      companyName: 'TransHorn Logistics',
    });
    console.log(`Created Transporter: transporter@test.com`);
  }

  // 3. Create Loads
  const openLoadId = uuidv4();
  await db.insert(loads).values({
    id: openLoadId,
    shipperId: shipperId,
    title: '40T Structural Steel',
    description: 'Djibouti to Dire Dawa structural steel delivery',
    origin: 'Djibouti Port',
    destination: 'Dire Dawa',
    weightKg: 40000,
    cargoType: 'Steel',
    budgetAmount: 340000,
    currency: 'ETB',
    status: 'POSTED',
    expiresAt: new Date(Date.now() + 86400000)
  });

  const transitLoadId = uuidv4();
  await db.insert(loads).values({
    id: transitLoadId,
    shipperId: shipperId,
    title: '25T Coffee Beans',
    description: 'Modjo to Djibouti Export',
    origin: 'Modjo Dry Port',
    destination: 'Djibouti Port',
    weightKg: 25000,
    cargoType: 'Coffee',
    budgetAmount: 285000,
    currency: 'ETB',
    status: 'IN_TRANSIT',
    expiresAt: new Date(Date.now() + 86400000)
  });

  // 4. Create Bids for Open Load
  await db.insert(bids).values({
    id: uuidv4(),
    loadId: openLoadId,
    transporterId: transporterId,
    amount: 340000,
    currency: 'ETB',
    status: 'SUBMITTED',
    estimatedTransitHours: 48
  });

  // 5. Create Active Shipment for Transit Load
  await db.insert(shipments).values({
    id: uuidv4(),
    loadId: transitLoadId,
    transporterId: transporterId,
    trackingNumber: 'SHP-9021-DJM',
    status: 'IN_TRANSIT',
    currentLocation: { coordinates: [40.1667, 8.9833] } // Awash
  });

  // 6. Create Contract Rates
  await db.insert(contracts).values({
    id: uuidv4(),
    shipperId: shipperId,
    transporterId: transporterId,
    origin: 'Djibouti Port',
    destination: 'Modjo Dry Port',
    lockedRate: 345000,
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
