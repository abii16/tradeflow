import { db } from './src/db';
import { users } from './src/db/schema/users';
import { contracts } from './src/db/schema/contracts';
import { eq } from 'drizzle-orm';

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

    // Check if contract already exists
    const existing = await db.select().from(contracts).where(eq(contracts.shipperId, shipper.id));
    if (existing.length === 0) {
      await db.insert(contracts).values({
        shipperId: shipper.id,
        transporterId: transporter.id,
        origin: 'Djibouti Port / Doraleh Container Terminal (DCT)',
        destination: 'Modjo Dry Port & Terminal, Ethiopia',
        lockedRate: '85000',
        status: 'ACTIVE',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
      console.log('Contract seeded successfully!');
    } else {
      console.log('Contract already exists');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
