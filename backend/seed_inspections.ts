import { db } from './src/db';
import { loads } from './src/db/schema/loads';
import { customsDocuments } from './src/db/schema/customs';
import { users } from './src/db/schema/users';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  try {
    const shippers = await db.select().from(users).where(eq(users.role, 'SHIPPER')).limit(1);
    if (shippers.length === 0) {
      console.log('No shippers found.');
      process.exit(1);
    }
    const shipper = shippers[0];

    const allLoads = await db.select().from(loads).limit(3);
    if (allLoads.length < 3) {
      console.log('Not enough loads to seed inspections.');
      process.exit(1);
    }

    // Insert 3 rejected customs documents for 3 different loads
    const rejectionReasons = [
      'Weight Discrepancy - 1200kg overweight detected at weighbridge',
      'Documentation Audit - Invoice total mismatch with packing list',
      'Random Security Physical Check'
    ];

    for (let i = 0; i < 3; i++) {
      const load = allLoads[i];
      const existing = await db.select().from(customsDocuments).where(eq(customsDocuments.loadId, load.id));
      
      if (existing.length === 0) {
        await db.insert(customsDocuments).values({
          loadId: load.id,
          uploadedBy: shipper.id,
          invoiceUrl: 'https://tradeflow.com/docs/INV-' + i + '.pdf',
          packingListUrl: 'https://tradeflow.com/docs/PKL-' + i + '.pdf',
          billOfLadingUrl: 'https://tradeflow.com/docs/BOL-' + i + '.pdf',
          certificateOfOriginUrl: 'https://tradeflow.com/docs/COO-' + i + '.pdf',
          status: 'REJECTED',
          rejectionReason: rejectionReasons[i],
          extractedData: { test: true }
        });
        console.log(`Inserted REJECTED customs doc for load ${load.id}`);
      } else {
        // Update to REJECTED if exists
        await db.update(customsDocuments)
          .set({ 
            status: 'REJECTED', 
            rejectionReason: rejectionReasons[i] 
          })
          .where(eq(customsDocuments.id, existing[0].id));
        console.log(`Updated customs doc for load ${load.id} to REJECTED`);
      }
    }

    console.log('Successfully seeded inspection data.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
