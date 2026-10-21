import { db, queryClient } from '../db/index';
import { customsDocuments } from '../db/schema/customs';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function seed() {
  try {
    console.log('Seeding authentic ERCA customs dossiers...');

    // Ensure uploads directory exists
    const folders = ['invoices', 'packing-lists', 'bills-of-lading', 'certificates-of-origin'];
    for (const f of folders) {
      const dir = path.join(process.cwd(), 'uploads', 'customs', f);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const sampleFile = path.join(dir, `sample-${f}.pdf`);
      if (!fs.existsSync(sampleFile)) {
        fs.writeFileSync(sampleFile, `%PDF-1.4\n% TradeFlow Official ERCA Document ${f.toUpperCase()}`);
      }
    }

    // Load FRAGILE: coffee (50e34554-8864-49b3-8ed2-5e03cb83d8ff)
    const targetLoadId = '50e34554-8864-49b3-8ed2-5e03cb83d8ff';
    const shipperId = 'c2f94bd9-2266-4042-8990-f2a64516537d';

    // Check if already exists
    const existing = await db.select().from(customsDocuments).where(eq(customsDocuments.loadId, targetLoadId));
    if (existing.length === 0) {
      const [doc] = await db.insert(customsDocuments).values({
        loadId: targetLoadId,
        uploadedBy: shipperId,
        invoiceUrl: '/uploads/customs/invoices/INV-ET-2024-COF-8841.pdf',
        packingListUrl: '/uploads/customs/packing-lists/PKL-ET-2024-COF-8841.pdf',
        billOfLadingUrl: '/uploads/customs/bills-of-lading/BOL-DJM-2024-COF-8841.pdf',
        certificateOfOriginUrl: '/uploads/customs/certificates-of-origin/COO-ETH-COFFEE-8841.pdf',
        status: 'CLEARED',
        extractedData: {
          invoice: {
            invoiceNumber: 'INV-ET-2024-8841',
            totalValue: '$48,500.00 USD',
            currency: 'USD',
            hsCode: '0901.11.00 (Ethiopian Arabica Grade 1)'
          },
          packingList: {
            invoiceNumber: 'INV-ET-2024-8841',
            totalWeight: '28,000 KG (350 Jute Bags x 80kg)',
            containerNumber: 'MSKU-982147-3'
          },
          billOfLading: {
            blNumber: 'BOL-DJM-2024-8841',
            vessel: 'CMA CGM BARRACUDA',
            portOfLoading: 'Djibouti Free Port (DCT)',
            portOfDischarge: 'Addis Ababa Kality Inland Terminal'
          },
          certificateOfOrigin: {
            cooNumber: 'COO-ETH-COFFEE-8841',
            issuingAuthority: 'Ethiopian Ministry of Trade & Regional Integration',
            origin: 'Sidama/Yirgacheffe, Ethiopia'
          },
          sha256Hashes: {
            invoice: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            packingList: '7d9b9a6b12a83e0a29b3864a781b0f51276a6e5a4f7832bc942b01a2f643e1d8',
            billOfLading: '4a189f78b19a0a283e74182f6e91024b89012a67bc453981ad627810fe912401',
            certificateOfOrigin: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
          },
          declarationNumber: 'ERCA-DJM-2024-009182',
          inspectionOffice: 'Galafi Customs Border Station',
          clearedByOfficer: 'Capt. Mulugeta Tesfaye (Badge #ERCA-4081)',
          clearanceTimestamp: '2026-10-21T08:30:00Z'
        }
      }).returning();

      console.log('Successfully seeded coffee customs dossier:', doc.id);
    } else {
      console.log('Customs dossier already exists for target load:', existing[0].id);
    }

    // Also seed Fuel Tanker (47034a13-7b29-4b7b-affe-91a3e40e3e5e) as UNDER_REVIEW
    const fuelLoadId = '47034a13-7b29-4b7b-affe-91a3e40e3e5e';
    const fuelExisting = await db.select().from(customsDocuments).where(eq(customsDocuments.loadId, fuelLoadId));
    if (fuelExisting.length === 0) {
      await db.insert(customsDocuments).values({
        loadId: fuelLoadId,
        uploadedBy: shipperId,
        invoiceUrl: '/uploads/customs/invoices/INV-ET-2024-FUEL-3021.pdf',
        packingListUrl: '/uploads/customs/packing-lists/PKL-ET-2024-FUEL-3021.pdf',
        billOfLadingUrl: '/uploads/customs/bills-of-lading/BOL-DJM-2024-FUEL-3021.pdf',
        certificateOfOriginUrl: '/uploads/customs/certificates-of-origin/COO-ETH-FUEL-3021.pdf',
        status: 'UNDER_REVIEW',
        extractedData: {
          invoice: {
            invoiceNumber: 'INV-ET-2024-3021',
            totalValue: '$62,000.00 USD',
            currency: 'USD',
            hsCode: '2710.12.00 (Refined Petroleum)'
          },
          packingList: {
            invoiceNumber: 'INV-ET-2024-3021',
            totalWeight: '32,000 LTR',
            containerNumber: 'TNK-ET-8910'
          },
          declarationNumber: 'ERCA-DJM-2024-007412',
          inspectionOffice: 'Galafi Checkpoint'
        }
      });
      console.log('Successfully seeded fuel tanker customs dossier');
    }

    await queryClient.end();
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
