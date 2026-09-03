import { Router, Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { customsDocuments } from '../db/schema/customs';
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
import { eq } from 'drizzle-orm';

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
 * Upload to Supabase Storage
 */
async function uploadToSupabase(file: Express.Multer.File, folder: string): Promise<string> {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${folder}/${randomUUID()}.${fileExtension}`;

  const { data, error } = await supabase.storage
    .from('tradeflow-documents')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('tradeflow-documents')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
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
      const invoiceText = await extractText(invoiceFile.buffer, invoiceFile.mimetype);
      const packingListText = await extractText(packingListFile.buffer, packingListFile.mimetype);

      const invoiceData = parseInvoice(invoiceText);
      const packingListData = parsePackingList(packingListText);

      // Step 2: Cross-Validation
      const isValid = validateCustomsDocuments(invoiceData, packingListData);

      if (!isValid) {
        res.status(422).json({
          error: 'Cross-validation failed. Invoice numbers do not match or could not be extracted.',
          extracted: {
            invoice: invoiceData,
            packingList: packingListData,
          },
        });
        return;
      }

      // Step 3: Supabase Upload
      const invoiceUrl = await uploadToSupabase(invoiceFile, 'invoices');
      const packingListUrl = await uploadToSupabase(packingListFile, 'packing-lists');
      const billOfLadingUrl = await uploadToSupabase(billOfLadingFile, 'bills-of-lading');
      const certificateOfOriginUrl = await uploadToSupabase(certificateOfOriginFile, 'certificates-of-origin');

      // Step 4: Database Insert
      const [newCustomsDoc] = await db.insert(customsDocuments).values({
        loadId,
        uploadedBy: req.user!.id,
        invoiceUrl,
        packingListUrl,
        billOfLadingUrl,
        certificateOfOriginUrl,
        status: 'SUBMITTED',
        extractedData: {
          invoice: invoiceData,
          packingList: packingListData,
        },
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
    
    // In our schema, customs documents are tied to loadId.
    // Assuming shipmentId maps directly to loadId in frontend logic, or we query appropriately.
    const docs = await db.select().from(customsDocuments).where(eq(customsDocuments.loadId, shipmentId));
    
    res.status(200).json({ documents: docs });
  } catch (error) {
    console.error('Error fetching customs documents:', error);
    res.status(500).json({ error: 'Failed to fetch customs documents' });
  }
});

export const customsRoutes = router;
