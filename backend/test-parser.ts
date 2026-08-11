import { parseInvoice, parsePackingList, validateCustomsDocuments } from './src/modules/customs/customs.parser';

console.log('--- 🚀 TradeFlow Customs Parser Test ---');

// 1. Mock Extracted Text from PDF/Image
const mockInvoiceText = `
  TRADEFLOW LOGISTICS
  Commercial Invoice
  -------------------
  Invoice No: TF-998877
  Date: 2026-08-11
  
  Items: Electronics
  Total Value: $ 4,500.00
`;

const mockPackingListText = `
  TRADEFLOW LOGISTICS
  Packing List
  -------------------
  Invoice # TF-998877
  Date: 2026-08-11
  
  Total Weight: 1250.50 kg
  Box count: 14
`;

// 2. Parse the text
console.log('\n🔍 Parsing Invoice...');
const invoiceData = parseInvoice(mockInvoiceText);
console.log(invoiceData);

console.log('\n🔍 Parsing Packing List...');
const packingListData = parsePackingList(mockPackingListText);
console.log(packingListData);

// 3. Cross Validation
console.log('\n⚖️ Cross-Validating Documents...');
const isValid = validateCustomsDocuments(invoiceData, packingListData);

if (isValid) {
  console.log('✅ VALID: Invoice numbers match! Documents are good to upload.');
} else {
  console.log('❌ INVALID: Invoice numbers do NOT match or are missing.');
}
