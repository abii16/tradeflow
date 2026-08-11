import pdfParseLib from 'pdf-parse';
const pdfParse = pdfParseLib as any;
import Tesseract from 'tesseract.js';

export interface ExtractedData {
  invoiceNumber: string | null;
  totalValue?: string | null;
  totalWeight?: string | null;
}

/**
 * Extracts text from a buffer based on mime type.
 * Supports PDFs via pdf-parse and Images via tesseract.js
 */
export async function extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }
  
  if (mimeType.startsWith('image/')) {
    const result = await Tesseract.recognize(fileBuffer, 'eng');
    return result.data.text;
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Parses a Commercial Invoice text for required fields.
 */
export function parseInvoice(text: string): ExtractedData {
  const invoiceNumberMatch = text.match(/invoice\s*(?:no|number|#)?\s*:?\s*([a-zA-Z0-9-]+)/i);
  const totalValueMatch = text.match(/total\s*(?:value|amount)?\s*:?\s*[\$£€]?\s*([\d,]+\.?\d*)/i);
  
  return {
    invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1].trim() : null,
    totalValue: totalValueMatch ? totalValueMatch[1].trim() : null,
  };
}

/**
 * Parses a Packing List text for required fields.
 */
export function parsePackingList(text: string): ExtractedData {
  const invoiceNumberMatch = text.match(/invoice\s*(?:no|number|#)?\s*:?\s*([a-zA-Z0-9-]+)/i);
  const totalWeightMatch = text.match(/total\s*weight\s*:?\s*([\d,]+\.?\d*)/i);
  
  return {
    invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1].trim() : null,
    totalWeight: totalWeightMatch ? totalWeightMatch[1].trim() : null,
  };
}

/**
 * Validates that both documents refer to the same invoice number.
 */
export function validateCustomsDocuments(invoiceData: ExtractedData, packingListData: ExtractedData): boolean {
  if (!invoiceData.invoiceNumber || !packingListData.invoiceNumber) {
    return false;
  }
  
  // Case-insensitive comparison and trim whitespace
  return invoiceData.invoiceNumber.toLowerCase() === packingListData.invoiceNumber.toLowerCase();
}
