import { parseInvoice, parsePackingList, validateCustomsDocuments } from '../src/modules/customs/customs.parser';

describe('Customs Parser Logic', () => {
  
  describe('Invoice Parser', () => {
    it('should correctly extract invoice number and total value', () => {
      const mockInvoiceText = `
        TRADEFLOW LOGISTICS
        Commercial Invoice
        -------------------
        Invoice No: TF-998877
        Date: 2026-08-11
        
        Items: Electronics
        Total Value: $ 4,500.00
      `;

      const result = parseInvoice(mockInvoiceText);
      expect(result.invoiceNumber).toBe('TF-998877');
      expect(result.totalValue).toBe('4,500.00');
    });

    it('should handle different variations of "Invoice"', () => {
      const mockInvoiceText = `Invoice# : INV-123\n Total Amount: 1,000.50`;
      const result = parseInvoice(mockInvoiceText);
      expect(result.invoiceNumber).toBe('INV-123');
      expect(result.totalValue).toBe('1,000.50');
    });
  });

  describe('Packing List Parser', () => {
    it('should correctly extract invoice number and total weight', () => {
      const mockPackingListText = `
        TRADEFLOW LOGISTICS
        Packing List
        -------------------
        Invoice # TF-998877
        Date: 2026-08-11
        
        Total Weight: 1250.50 kg
        Box count: 14
      `;

      const result = parsePackingList(mockPackingListText);
      expect(result.invoiceNumber).toBe('TF-998877');
      expect(result.totalWeight).toBe('1250.50');
    });
  });

  describe('Cross Validation', () => {
    it('should return true when invoice numbers match exactly', () => {
      const invoiceData = { invoiceNumber: 'TF-100', totalValue: '100' };
      const packingListData = { invoiceNumber: 'TF-100', totalWeight: '50' };
      
      expect(validateCustomsDocuments(invoiceData, packingListData)).toBe(true);
    });

    it('should return true when invoice numbers match case-insensitively', () => {
      const invoiceData = { invoiceNumber: 'tf-100', totalValue: '100' };
      const packingListData = { invoiceNumber: 'TF-100', totalWeight: '50' };
      
      expect(validateCustomsDocuments(invoiceData, packingListData)).toBe(true);
    });

    it('should return false when invoice numbers do not match', () => {
      const invoiceData = { invoiceNumber: 'TF-100' };
      const packingListData = { invoiceNumber: 'TF-200' };
      
      expect(validateCustomsDocuments(invoiceData, packingListData)).toBe(false);
    });

    it('should return false if either invoice number is null', () => {
      expect(validateCustomsDocuments({ invoiceNumber: null }, { invoiceNumber: 'TF-200' })).toBe(false);
      expect(validateCustomsDocuments({ invoiceNumber: 'TF-100' }, { invoiceNumber: null })).toBe(false);
    });
  });
});
