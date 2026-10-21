import { Router, Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { db } from '../db';
import fs from 'fs';
import path from 'path';
import { customsDocuments } from '../db/schema/customs';
import { shipments } from '../db/schema/shipments';
import { JwtAuthGuard as requireAuth } from '../auth/guards/jwt-auth.guard';
// Assuming supabase client is exported from this path as requested
import { supabase } from '../db/supabase';
import {
  extractText,
  parseInvoice,
  parsePackingList,
  validateCustomsDocuments,
} from '../modules/customs/customs.parser';
import { auditMiddleware } from '../middleware/audit.middleware';
import { eq, inArray, desc, or } from 'drizzle-orm';
import { loads } from '../db/schema/loads';

const router = Router();

// Configure multer memory storage
const storage = multer.memoryStorage();

// File filter based on requirements
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter,
});

/**
 * Upload to Supabase Storage with graceful local filesystem fallback
 */
async function saveCustomsFile(file: Express.Multer.File, folder: string): Promise<string> {
  const fileExtension = file.originalname.split('.').pop() || 'pdf';
  const fileName = `${folder}/${randomUUID()}.${fileExtension}`;

  // 1. Try Supabase storage if available
  try {
    const { data, error } = await supabase.storage
      .from('tradeflow-documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (!error && data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from('tradeflow-documents')
        .getPublicUrl(data.path);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (supabaseErr) {
    // Continue to reliable local storage fallback
  }

  // 2. Reliable local storage fallback served via /uploads static router
  const uploadDir = path.join(process.cwd(), 'uploads', 'customs', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localFileName = `${randomUUID()}.${fileExtension}`;
  const filePath = path.join(uploadDir, localFileName);
  fs.writeFileSync(filePath, file.buffer);

  return `/uploads/customs/${folder}/${localFileName}`;
}

/**
 * POST /customs/upload
 * Requires: Authentication
 */
router.post(
  '/upload',
  requireAuth,
  upload.fields([
    { name: 'invoice', maxCount: 1 },
    { name: 'packing_list', maxCount: 1 },
    { name: 'bill_of_lading', maxCount: 1 },
    { name: 'certificate_of_origin', maxCount: 1 },
  ]),
  auditMiddleware('DOCUMENT_SUBMISSION'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const invoiceFile = files?.['invoice']?.[0];
      const packingListFile = files?.['packing_list']?.[0];
      const billOfLadingFile = files?.['bill_of_lading']?.[0];
      const certificateOfOriginFile = files?.['certificate_of_origin']?.[0];

      const loadId = req.body.loadId;

      if (!invoiceFile || !packingListFile || !billOfLadingFile || !certificateOfOriginFile) {
        res.status(400).json({ error: 'All 4 customs documents (invoice, packing list, bill of lading, certificate of origin) are required.' });
        return;
      }

      if (!loadId) {
        res.status(400).json({ error: 'loadId is required.' });
        return;
      }

      // Step 1: Data Extraction
      let invoiceData: any = { invoiceNumber: null, totalValue: null };
      let packingListData: any = { invoiceNumber: null, totalWeight: null };
      let isValid = false;

      try {
        const invoiceText = await extractText(invoiceFile.buffer, invoiceFile.mimetype);
        const packingListText = await extractText(packingListFile.buffer, packingListFile.mimetype);

        invoiceData = parseInvoice(invoiceText);
        packingListData = parsePackingList(packingListText);
        isValid = validateCustomsDocuments(invoiceData, packingListData);
      } catch (ocrErr) {
        console.warn('OCR extraction warning (will proceed with manual review):', ocrErr);
      }

      const finalExtracted = {
        invoice: invoiceData,
        packingList: packingListData,
        crossValidationPassed: isValid,
        sha256Hashes: {
          invoice: req.body.invoice_sha256 || null,
          packingList: req.body.packing_list_sha256 || null,
          billOfLading: req.body.bill_of_lading_sha256 || null,
          certificateOfOrigin: req.body.certificate_of_origin_sha256 || null,
        },
        submissionDate: new Date().toISOString()
      };

      // Step 2: Storage (Supabase or local fallback)
      const invoiceUrl = await saveCustomsFile(invoiceFile, 'invoices');
      const packingListUrl = await saveCustomsFile(packingListFile, 'packing-lists');
      const billOfLadingUrl = await saveCustomsFile(billOfLadingFile, 'bills-of-lading');
      const certificateOfOriginUrl = await saveCustomsFile(certificateOfOriginFile, 'certificates-of-origin');

      // Step 3: Database Insert
      const [newCustomsDoc] = await db.insert(customsDocuments).values({
        loadId,
        uploadedBy: req.user!.id,
        invoiceUrl,
        packingListUrl,
        billOfLadingUrl,
        certificateOfOriginUrl,
        status: isValid && invoiceData.invoiceNumber ? 'CLEARED' : 'SUBMITTED',
        extractedData: finalExtracted,
      }).returning();

      res.status(201).json({
        message: 'Documents validated and uploaded successfully.',
        data: newCustomsDoc,
      });
    } catch (error: any) {
      console.error('Customs upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to process customs documents.' });
    }
  }
);

router.get('/shipments/:shipmentId/documents', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { shipmentId } = req.params;

    if (shipmentId === 'all' || shipmentId === 'my-documents') {
      const docs = await db.select().from(customsDocuments)
        .where(eq(customsDocuments.uploadedBy, req.user!.id))
        .orderBy(desc(customsDocuments.createdAt));
      res.status(200).json({ documents: docs });
      return;
    }

    let targetLoadId = shipmentId;
    const [shipment] = await db.select({ loadId: shipments.loadId }).from(shipments).where(eq(shipments.id, shipmentId));
    if (shipment && shipment.loadId) {
      targetLoadId = shipment.loadId;
    }

    const docs = await db.select().from(customsDocuments)
      .where(
        or(
          eq(customsDocuments.loadId, targetLoadId),
          eq(customsDocuments.loadId, shipmentId)
        )
      )
      .orderBy(desc(customsDocuments.createdAt));

    res.status(200).json({ documents: docs });
  } catch (error) {
    console.error('Error fetching customs documents:', error);
    res.status(500).json({ error: 'Failed to fetch customs documents' });
  }
});

router.get('/queue', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const queueDocs = await db.select({
      id: customsDocuments.id,
      loadId: customsDocuments.loadId,
      status: customsDocuments.status,
      extractedData: customsDocuments.extractedData,
      invoiceUrl: customsDocuments.invoiceUrl,
      packingListUrl: customsDocuments.packingListUrl,
      billOfLadingUrl: customsDocuments.billOfLadingUrl,
      certificateOfOriginUrl: customsDocuments.certificateOfOriginUrl,
      createdAt: customsDocuments.createdAt,
      loadTitle: loads.title,
      shipperId: loads.shipperId,
    })
      .from(customsDocuments)
      .leftJoin(loads, eq(customsDocuments.loadId, loads.id))
      .where(inArray(customsDocuments.status, ['SUBMITTED', 'UNDER_REVIEW']))
      .orderBy(desc(customsDocuments.createdAt));

    res.status(200).json({ queue: queueDocs });
  } catch (error) {
    console.error('Error fetching customs queue:', error);
    res.status(500).json({ error: 'Failed to fetch customs queue' });
  }
});

router.get('/inspections', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const inspectionDocs = await db.select({
      id: customsDocuments.id,
      loadId: customsDocuments.loadId,
      status: customsDocuments.status,
      rejectionReason: customsDocuments.rejectionReason,
      createdAt: customsDocuments.createdAt,
      loadTitle: loads.title,
    })
      .from(customsDocuments)
      .leftJoin(loads, eq(customsDocuments.loadId, loads.id))
      .where(eq(customsDocuments.status, 'REJECTED'))
      .orderBy(desc(customsDocuments.updatedAt));

    res.status(200).json({ inspections: inspectionDocs });
  } catch (error) {
    console.error('Error fetching customs inspections:', error);
    res.status(500).json({ error: 'Failed to fetch customs inspections' });
  }
});

router.patch('/:id/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['CLEARED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const [updatedDoc] = await db
      .update(customsDocuments)
      .set({
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        updatedAt: new Date(),
      })
      .where(eq(customsDocuments.id, id))
      .returning();

    if (!updatedDoc) {
      res.status(404).json({ error: 'Customs document not found' });
      return;
    }

    res.status(200).json({ message: 'Status updated successfully', data: updatedDoc });
  } catch (error) {
    console.error('Error updating customs status:', error);
    res.status(500).json({ error: 'Failed to update customs status' });
  }
});

export const customsRoutes = router;
