import { db } from './src/db';
import { shipments } from './src/db/schema/shipments';
import { customsDocuments } from './src/db/schema/customs';
import { users } from './src/db/schema/users';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    // Find the IN_TRANSIT shipment
    const activeShipments = await db.select().from(shipments).where(eq(shipments.status, 'IN_TRANSIT'));
    
    if (activeShipments.length === 0) {
      console.log('No active shipments found to attach customs documents to.');
      process.exit(1);
    }
    
    // Pick the most recent one
    const shipment = activeShipments[activeShipments.length - 1];
    
    // Get a user to act as uploader
    const shippers = await db.select().from(users).where(eq(users.email, 'ship@gmail.com')).limit(1);
    if (shippers.length === 0) {
        console.log('Shipper user not found');
        process.exit(1);
    }
    const shipper = shippers[0];
    
    // Check if customs doc already exists
    const existingDocs = await db.select().from(customsDocuments).where(eq(customsDocuments.loadId, shipment.loadId));
    
    if (existingDocs.length === 0) {
      await db.insert(customsDocuments).values({
        loadId: shipment.loadId,
        uploadedBy: shipper.id,
        invoiceUrl: 'https://tradeflow.com/docs/INV-8829.pdf',
        packingListUrl: 'https://tradeflow.com/docs/PKL-8829.pdf',
        billOfLadingUrl: 'https://tradeflow.com/docs/BOL-8829.pdf',
        certificateOfOriginUrl: 'https://tradeflow.com/docs/COO-8829.pdf',
        status: 'UNDER_REVIEW',
        extractedData: { test: true }
      });
      console.log('Customs documents seeded successfully for load', shipment.loadId);
    } else {
      console.log('Customs documents already exist for load', shipment.loadId);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
