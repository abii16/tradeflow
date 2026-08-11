import pdfParseLib from 'pdf-parse';
const pdfParse = pdfParseLib as any;
import Tesseract from 'tesseract.js';

export interface ExtractedData {
  invoiceNumber: string | null;
  totalValue?: string | null;
  totalWeight?: string | null;
}

import xlsx from 'xlsx';
import mammoth from 'mammoth';

/**
 * Extracts text from a buffer based on mime type.
 * Supports PDFs, Images, Excel, and Word files.
 */
export async function extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(fileBuffer);
    return data.text.toLowerCase();
  }
  
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType === 'application/vnd.ms-excel') {
    console.log("Excel ፋይል እየተነበበ ነው...");
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    let fullText = "";
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      fullText += xlsx.utils.sheet_to_txt(sheet) + " ";
    });
    return fullText.toLowerCase();
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    console.log("Word ፋይል እየተነበበ ነው...");
    const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
    return value.toLowerCase();
  }
  
  if (mimeType.startsWith('image/')) {
    console.log("ፎቶ እየተነበበ ነው...");
    const result = await Tesseract.recognize(fileBuffer, 'eng');
    return result.data.text.toLowerCase();
  }
  
  throw new Error("የማይታወቅ የፋይል አይነት! እባክዎ PDF, ፎቶ, Word ወይም Excel ብቻ ይጫኑ።");
}

/**
 * Parses a Commercial Invoice text for required fields.
 */
export function parseInvoice(text: string): ExtractedData {
  const invoiceNumberMatch = text.match(/invoice[ \t]*(?:no\.?|number|#)?[ \t]*:?[ \t]*([a-zA-Z0-9-]+)/i);
  const totalValueMatch = text.match(/total[ \t]*(?:value|amount)?[ \t]*:?[ \t]*[\$£€]?[ \t]*([\d,]+\.?\d*)/i);
  
  return {
    invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1].trim() : null,
    totalValue: totalValueMatch ? totalValueMatch[1].trim() : null,
  };
}

/**
 * Parses a Packing List text for required fields.
 */
export function parsePackingList(text: string): ExtractedData {
  const invoiceNumberMatch = text.match(/invoice[ \t]*(?:no\.?|number|#)?[ \t]*:?[ \t]*([a-zA-Z0-9-]+)/i);
  const totalWeightMatch = text.match(/total[ \t]*weight[ \t]*:?[ \t]*([\d,]+\.?\d*)/i);
  
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
