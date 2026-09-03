import { db } from './src/db';
import { users } from './src/db/schema/users';
import { loads } from './src/db/schema/loads';
import { customsDocuments } from './src/db/schema/customs';

async function seed() {
  console.log('Seeding customs document...');
  
  // Find a shipper
  const shipper = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.role, 'SHIPPER'),
  });

  if (!shipper) {
    console.error('No shipper found');
    process.exit(1);
  }

  // Find or create a load
  let load = await db.query.loads.findFirst();
  if (!load) {
    [load] = await db.insert(loads).values({
      shipperId: shipper.id,
      title: 'Industrial Machinery to Addis',
      weightKg: '25000.00',
      origin: { address: 'Djibouti Port', city: 'Djibouti', lat: 11.6, lng: 43.1 },
      destination: { address: 'Modjo Dry Port', city: 'Modjo', lat: 8.6, lng: 39.1 },
      status: 'IN_TRANSIT'
    }).returning();
  }

  // Insert a customs document
  const [doc] = await db.insert(customsDocuments).values({
    loadId: load.id,
    uploadedBy: shipper.id,
    invoiceUrl: 'https://example.com/invoice.pdf',
    packingListUrl: 'https://example.com/packing-list.pdf',
    billOfLadingUrl: 'https://example.com/bol.pdf',
    certificateOfOriginUrl: 'https://example.com/coo.pdf',
    status: 'SUBMITTED',
    extractedData: {
      invoice: { totalAmount: 45000, currency: 'USD' },
      packingList: { totalWeight: 24500 }
    }
  }).returning();

  console.log('Inserted customs document:', doc.id);
  process.exit(0);
}

seed().catch(console.error);
