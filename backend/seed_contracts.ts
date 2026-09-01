import { db } from './src/db/index.js';
import { contracts } from './src/db/schema/contracts.js';
import { users } from './src/db/schema/users.js';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    const existing = await db.select().from(contracts);
    if (existing.length === 0) {
      console.log('Seeding contracts...');
      // Need a user to be the shipper
      let user = await db.query.users.findFirst({ where: eq(users.role, 'SHIPPER') });
      if (!user) {
        console.log('Creating mock shipper user...');
        const [newUser] = await db.insert(users).values({
          email: 'mockshipper' + Date.now() + '@example.com',
          fullName: 'Ethio Agri Export',
          companyName: 'Ethio Agri Export',
          phone: '0911000000',
          role: 'SHIPPER'
        }).returning();
        user = newUser;
      }

      let transporter = await db.query.users.findFirst({ where: eq(users.role, 'TRANSPORTER') });
      if (!transporter) {
        const [newTransporter] = await db.insert(users).values({
          email: 'mocktransporter' + Date.now() + '@example.com',
          fullName: 'Global Trade Logistics',
          companyName: 'Global Trade Logistics',
          phone: '0911000001',
          role: 'TRANSPORTER'
        }).returning();
        transporter = newTransporter;
      }

      await db.insert(contracts).values([
        {
          shipperId: user.id,
          transporterId: transporter.id,
          origin: 'Djibouti',
          destination: 'Modjo',
          lockedRate: '270000.00',
          status: 'ACTIVE',
          validUntil: new Date(Date.now() + 86400000 * 30) // 30 days
        },
        {
          shipperId: user.id,
          transporterId: transporter.id,
          origin: 'Djibouti',
          destination: 'Modjo',
          lockedRate: '290000.00',
          status: 'ACTIVE',
          validUntil: new Date(Date.now() + 86400000 * 30) // 30 days
        }
      ]);
      console.log('Seeded 2 contracts.');
    } else {
      console.log(`Found ${existing.length} contracts.`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
