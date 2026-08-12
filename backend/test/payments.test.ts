import { telebirrService } from '../src/modules/payments/telebirr.service';
import {
  CreateCheckoutSchema,
  TelebirrWebhookSchema,
  CreateDisputeSchema,
  ResolveDisputeSchema,
  RetryPayoutSchema,
  QueryPaymentsSchema,
} from '../src/dto/payments.dto';

describe('TeleBirr Payments, Webhooks, Payouts & Failure Handlers (Standalone Suite)', () => {
  describe('1. TeleBirr Cryptographic Signatures & Verification (FR-10.1)', () => {
    it('should generate a valid deterministic HMAC-SHA256 signature for parameters', () => {
      const payload = {
        outTradeNo: 'TF-PAY-1001',
        totalAmount: '75000.00',
        tradeStatus: 'SUCCESS',
        transactionNo: 'TB-TXN-999',
      };

      const signature = telebirrService.generateSignature(payload);
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA-256 hex string length
    });

    it('should verify an authentic TeleBirr webhook signature', () => {
      const payload: Record<string, any> = {
        outTradeNo: 'TF-PAY-1002',
        msisdn: '+251911223344',
        totalAmount: '50000.00',
        tradeStatus: 'SUCCESS',
        transactionNo: 'TB-TXN-888',
      };

      const signature = telebirrService.generateSignature(payload);
      payload.signature = signature;

      const isValid = telebirrService.verifyWebhookSignature(payload);
      expect(isValid).toBe(true);
    });

    it('should reject a tampered or forged webhook payload', () => {
      const payload: Record<string, any> = {
        outTradeNo: 'TF-PAY-1003',
        totalAmount: '50000.00',
        tradeStatus: 'SUCCESS',
        transactionNo: 'TB-TXN-888',
      };

      const signature = telebirrService.generateSignature(payload);
      // Tamper with the amount after signing
      payload.totalAmount = '100.00';
      payload.signature = signature;

      const isValid = telebirrService.verifyWebhookSignature(payload);
      expect(isValid).toBe(false);
    });

    it('should reject webhook verification when signature is missing', () => {
      const payload = {
        outTradeNo: 'TF-PAY-1004',
        totalAmount: '50000.00',
        tradeStatus: 'SUCCESS',
      };

      const isValid = telebirrService.verifyWebhookSignature(payload);
      expect(isValid).toBe(false);
    });
  });

  describe('2. TeleBirr C2B Checkout & Platform Commission Calculations (FR-10.2)', () => {
    it('should create a valid TeleBirr checkout session URL and payload in sandbox mode', async () => {
      const result = await telebirrService.createCheckoutSession({
        outTradeNo: 'TF-PAY-TEST-001',
        amount: 80000.0,
        currency: 'ETB',
        title: 'Djibouti to Modjo Coffee Shipment',
        returnUrl: 'https://tradeflow.et/payment/callback',
      });

      expect(result.outTradeNo).toBe('TF-PAY-TEST-001');
      expect(result.checkoutUrl).toContain('https://mock.telebirr.et/pay');
      expect(result.checkoutUrl).toContain('amount=80000.00');
      expect(result.prepayId).toBe('PREPAY-TF-PAY-TEST-001');
    });

    it('should correctly calculate 5% platform commission and net transporter payout', () => {
      const bidAmount = 75000.0;
      const commissionRate = 0.05; // 5%
      const commissionAmount = Number((bidAmount * commissionRate).toFixed(2));
      const netPayoutAmount = Number((bidAmount - commissionAmount).toFixed(2));

      expect(commissionAmount).toBe(3750.0);
      expect(netPayoutAmount).toBe(71250.0);
      expect(commissionAmount + netPayoutAmount).toBe(bidAmount);
    });

    it('should correctly calculate commission for uneven/fractional amounts', () => {
      const bidAmount = 33333.33;
      const commissionRate = 0.05;
      const commissionAmount = Number((bidAmount * commissionRate).toFixed(2));
      const netPayoutAmount = Number((bidAmount - commissionAmount).toFixed(2));

      expect(commissionAmount).toBe(1666.67);
      expect(netPayoutAmount).toBe(31666.66);
    });
  });

  describe('3. TeleBirr B2C Payout & Query-Before-Retry Verification (FR-10.1 & FR-10.2)', () => {
    it('should successfully execute B2C disbursement to transporter mobile money wallet', async () => {
      const payoutResult = await telebirrService.executeB2CPayout({
        outTradeNo: 'TF-PAY-B2C-001',
        receiverPhone: '+251911223344',
        amount: '71250.00',
        currency: 'ETB',
        remark: 'TradeFlow Transporter Settlement',
      });

      expect(payoutResult.success).toBe(true);
      expect(payoutResult.status).toBe('SUCCESS');
      expect(payoutResult.telebirrTxnId).toBeDefined();
      expect(payoutResult.telebirrTxnId).toContain('TB-TXN-');
    });

    it('should simulate B2C failure when receiver phone ends with 9999 (Simulated Failure Trigger)', async () => {
      const payoutResult = await telebirrService.executeB2CPayout({
        outTradeNo: 'TF-PAY-FAIL-001',
        receiverPhone: '+251911009999',
        amount: '47500.00',
      });

      expect(payoutResult.success).toBe(false);
      expect(payoutResult.status).toBe('FAILED');
      expect(payoutResult.message).toContain('Simulated TeleBirr');
    });

    it('should query transaction status for remote ground truth (Query-Before-Retry)', async () => {
      const queryResult = await telebirrService.queryTransactionStatus('TF-PAY-ALREADY_PAID-999');

      expect(queryResult.outTradeNo).toBe('TF-PAY-ALREADY_PAID-999');
      expect(queryResult.tradeStatus).toBe('SUCCESS');
      expect(queryResult.telebirrTxnId).toBeDefined();
    });

    it('should execute refund request successfully', async () => {
      const refundSuccess = await telebirrService.executeRefund({
        outTradeNo: 'TF-PAY-REFUND-001',
        refundAmount: '75000.00',
        originalTxnId: 'TB-TXN-ORIG-123',
        reason: 'Shipper Cancellation Refund',
      });

      expect(refundSuccess).toBe(true);
    });
  });

  describe('4. Exponential Backoff & Retry Calculations', () => {
    it('should compute correct exponential delays for retry attempts', () => {
      const computeDelaySeconds = (retryCount: number) => Math.min(60 * Math.pow(2, retryCount), 3600);

      expect(computeDelaySeconds(0)).toBe(60); // 1st retry: 1 min
      expect(computeDelaySeconds(1)).toBe(120); // 2nd retry: 2 mins
      expect(computeDelaySeconds(2)).toBe(240); // 3rd retry: 4 mins
      expect(computeDelaySeconds(3)).toBe(480); // 4th retry: 8 mins
      expect(computeDelaySeconds(6)).toBe(3600); // Capped at 1 hour
    });
  });

  describe('5. DTO Validation Schemas', () => {
    it('should validate valid checkout request DTO', () => {
      const validCheckout = {
        shipmentId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        paymentMethod: 'TELEBIRR',
        returnUrl: 'https://tradeflow.et/shipper/callback',
      };

      const result = CreateCheckoutSchema.safeParse(validCheckout);
      expect(result.success).toBe(true);
    });

    it('should reject invalid shipment UUID in checkout request', () => {
      const invalidCheckout = {
        shipmentId: 'non-uuid-string',
        paymentMethod: 'TELEBIRR',
      };

      const result = CreateCheckoutSchema.safeParse(invalidCheckout);
      expect(result.success).toBe(false);
    });

    it('should validate valid TeleBirr webhook DTO', () => {
      const validWebhook = {
        outTradeNo: 'TF-PAY-2026-001',
        totalAmount: '75000.00',
        tradeStatus: 'SUCCESS',
        transactionNo: 'TB-TXN-12345',
        msisdn: '+251911223344',
      };

      const result = TelebirrWebhookSchema.safeParse(validWebhook);
      expect(result.success).toBe(true);
    });

    it('should validate dispute creation and resolution DTOs', () => {
      const validDispute = {
        reason: 'Cargo damaged during transit: torn coffee sacks',
        evidenceUrl: 'https://tradeflow.et/storage/proof.jpg',
      };
      const disputeResult = CreateDisputeSchema.safeParse(validDispute);
      expect(disputeResult.success).toBe(true);

      const validResolution = {
        resolution: 'RESOLVED_REFUND',
        resolutionNotes: 'Inspection confirmed damage. Refund authorized.',
      };
      const resolutionResult = ResolveDisputeSchema.safeParse(validResolution);
      expect(resolutionResult.success).toBe(true);
    });

    it('should validate query payments DTO with pagination defaults', () => {
      const query = {
        status: 'ESCROW_HELD',
        payoutStatus: 'SCHEDULED',
        limit: '15',
        offset: '0',
      };

      const result = QueryPaymentsSchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(15);
        expect(result.data.offset).toBe(0);
        expect(result.data.status).toBe('ESCROW_HELD');
      }
    });
  });
});
