import crypto from 'crypto';
import axios from 'axios';

export interface TelebirrCheckoutParams {
  outTradeNo: string;
  amount: number | string;
  currency?: string;
  title: string;
  returnUrl?: string;
  notifyUrl?: string;
}

export interface TelebirrCheckoutResult {
  outTradeNo: string;
  checkoutUrl: string;
  prepayId?: string;
  rawPayload: any;
}

export interface TelebirrPayoutParams {
  outTradeNo: string;
  receiverPhone: string;
  amount: number | string;
  currency?: string;
  remark?: string;
}

export interface TelebirrPayoutResult {
  success: boolean;
  telebirrTxnId?: string;
  outTradeNo: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message?: string;
  rawResponse?: any;
}

export interface TelebirrQueryStatusResult {
  outTradeNo: string;
  telebirrTxnId?: string;
  tradeStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN';
  amount?: string;
  paidTime?: string;
}

export class TelebirrService {
  private appId: string;
  private appKey: string;
  private publicKey: string;
  private privateKey: string;
  private shortCode: string;
  private baseUrl: string;
  private notifyUrl: string;
  private isSandbox: boolean;

  constructor() {
    this.appId = process.env.TELEBIRR_APP_ID || 'tradeflow-telebirr-app-id';
    this.appKey = process.env.TELEBIRR_APP_KEY || 'tradeflow-telebirr-secret-key';
    this.publicKey = process.env.TELEBIRR_PUBLIC_KEY || 'mock-public-key';
    this.privateKey = process.env.TELEBIRR_PRIVATE_KEY || 'mock-private-key';
    this.shortCode = process.env.TELEBIRR_SHORT_CODE || '100123';
    this.baseUrl = process.env.TELEBIRR_API_URL || 'https://app.ethiomobilemoney.et:2121/api';
    this.notifyUrl = process.env.TELEBIRR_NOTIFY_URL || 'https://api.tradeflow.et/payments/webhook/telebirr';
    this.isSandbox = process.env.TELEBIRR_SANDBOX_MODE !== 'false';
  }

  /**
   * Generates HMAC-SHA256 signature for parameters by sorting alphabetically.
   */
  public generateSignature(params: Record<string, any>, key: string = this.appKey): string {
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== 'signature' && k !== 'sign' && params[k] !== undefined && params[k] !== null && params[k] !== '')
      .sort();

    const signString = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    return crypto.createHmac('sha256', key).update(signString).digest('hex');
  }

  /**
   * Cryptographically verifies incoming TeleBirr webhook signature.
   */
  public verifyWebhookSignature(payload: Record<string, any>, signature?: string): boolean {
    const incomingSign = signature || payload.signature || payload.sign;
    if (!incomingSign) {
      return false;
    }

    const calculatedSign = this.generateSignature(payload, this.appKey);
    
    // Constant-time comparison to prevent timing attacks
    try {
      const bufA = Buffer.from(calculatedSign, 'hex');
      const bufB = Buffer.from(incomingSign, 'hex');
      if (bufA.length !== bufB.length) {
        return false;
      }
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return calculatedSign === incomingSign;
    }
  }

  /**
   * Initiates C2B Checkout Session with TeleBirr
   */
  public async createCheckoutSession(params: TelebirrCheckoutParams): Promise<TelebirrCheckoutResult> {
    const amountStr = typeof params.amount === 'number' ? params.amount.toFixed(2) : params.amount;
    const requestData = {
      appId: this.appId,
      shortCode: this.shortCode,
      outTradeNo: params.outTradeNo,
      subject: params.title,
      totalAmount: amountStr,
      receiveName: 'TradeFlow Logistics Ltd',
      returnUrl: params.returnUrl || 'https://tradeflow.et/payment/callback',
      notifyUrl: params.notifyUrl || this.notifyUrl,
      timestamp: Date.now().toString(),
      nonce: crypto.randomBytes(8).toString('hex'),
    };

    const signature = this.generateSignature(requestData, this.appKey);
    const payload = { ...requestData, signature };

    if (this.isSandbox || process.env.NODE_ENV === 'test') {
      // Mock / Sandbox response
      const mockCheckoutUrl = `https://mock.telebirr.et/pay?tradeNo=${params.outTradeNo}&amount=${amountStr}&appId=${this.appId}`;
      return {
        outTradeNo: params.outTradeNo,
        checkoutUrl: mockCheckoutUrl,
        prepayId: `PREPAY-${params.outTradeNo}`,
        rawPayload: payload,
      };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/toTradeWebPay`, payload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response.data;
      if (data && data.code === 200 && data.data?.toPayUrl) {
        return {
          outTradeNo: params.outTradeNo,
          checkoutUrl: data.data.toPayUrl,
          prepayId: data.data.prepayId,
          rawPayload: data,
        };
      } else {
        throw new Error(`TeleBirr Checkout error: ${data?.message || 'Unknown response'}`);
      }
    } catch (error: any) {
      console.error('[TeleBirr Service] Checkout initiation failed:', error.message);
      throw new Error(`TeleBirr checkout failed: ${error.message}`);
    }
  }

  /**
   * Executes B2C Direct Payout / Disbursement to Transporter Mobile Money Wallet
   */
  public async executeB2CPayout(params: TelebirrPayoutParams): Promise<TelebirrPayoutResult> {
    const amountStr = typeof params.amount === 'number' ? params.amount.toFixed(2) : params.amount;
    const requestData = {
      appId: this.appId,
      shortCode: this.shortCode,
      outTradeNo: params.outTradeNo,
      receiverPhone: params.receiverPhone,
      amount: amountStr,
      currency: params.currency || 'ETB',
      remark: params.remark || 'TradeFlow Transporter Payout',
      timestamp: Date.now().toString(),
      nonce: crypto.randomBytes(8).toString('hex'),
    };

    const signature = this.generateSignature(requestData, this.appKey);
    const payload = { ...requestData, signature };

    if (this.isSandbox || process.env.NODE_ENV === 'test') {
      // Check for simulated failure trigger (e.g. phone number ending in 9999)
      if (params.receiverPhone.endsWith('9999')) {
        return {
          success: false,
          outTradeNo: params.outTradeNo,
          status: 'FAILED',
          message: 'Simulated TeleBirr network timeout / receiver wallet locked',
          rawResponse: { code: 500, error: 'WALLET_LOCKED' },
        };
      }

      const mockTxnId = `TB-TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      return {
        success: true,
        telebirrTxnId: mockTxnId,
        outTradeNo: params.outTradeNo,
        status: 'SUCCESS',
        message: 'Disbursement successful',
        rawResponse: { code: 200, txnId: mockTxnId, status: 'SUCCESS' },
      };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/b2c/disbursement`, payload, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response.data;
      if (data && (data.code === 200 || data.code === 0)) {
        return {
          success: true,
          telebirrTxnId: data.data?.transactionNo || data.data?.txnId,
          outTradeNo: params.outTradeNo,
          status: 'SUCCESS',
          message: data.message || 'Payout completed successfully',
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          outTradeNo: params.outTradeNo,
          status: 'FAILED',
          message: data?.message || 'TeleBirr B2C disbursement rejected',
          rawResponse: data,
        };
      }
    } catch (error: any) {
      console.error('[TeleBirr Service] B2C Payout failed:', error.message);
      return {
        success: false,
        outTradeNo: params.outTradeNo,
        status: 'FAILED',
        message: error.message || 'TeleBirr connection timeout',
        rawResponse: { error: error.message },
      };
    }
  }

  /**
   * Queries Ground-Truth Transaction Status from TeleBirr API (Used in Query-Before-Retry)
   */
  public async queryTransactionStatus(outTradeNo: string): Promise<TelebirrQueryStatusResult> {
    const requestData = {
      appId: this.appId,
      shortCode: this.shortCode,
      outTradeNo,
      timestamp: Date.now().toString(),
    };

    const signature = this.generateSignature(requestData, this.appKey);
    const payload = { ...requestData, signature };

    if (this.isSandbox || process.env.NODE_ENV === 'test') {
      // In sandbox/mock, return SUCCESS if outTradeNo contains 'ALREADY_PAID', else UNKNOWN
      if (outTradeNo.includes('ALREADY_PAID')) {
        return {
          outTradeNo,
          telebirrTxnId: `TB-QUERY-${Date.now()}`,
          tradeStatus: 'SUCCESS',
          amount: '1000.00',
          paidTime: new Date().toISOString(),
        };
      }
      return {
        outTradeNo,
        tradeStatus: 'UNKNOWN',
      };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/queryOrder`, payload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response.data;
      if (data && data.code === 200 && data.data) {
        const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PENDING'> = {
          SUCCESS: 'SUCCESS',
          COMPLETED: 'SUCCESS',
          FAILED: 'FAILED',
          PENDING: 'PENDING',
          PROCESSING: 'PENDING',
        };
        return {
          outTradeNo,
          telebirrTxnId: data.data.transactionNo,
          tradeStatus: statusMap[data.data.tradeStatus] || 'UNKNOWN',
          amount: data.data.totalAmount,
          paidTime: data.data.tradeTime,
        };
      }
      return { outTradeNo, tradeStatus: 'UNKNOWN' };
    } catch (error: any) {
      console.error('[TeleBirr Service] Query transaction status error:', error.message);
      return { outTradeNo, tradeStatus: 'UNKNOWN' };
    }
  }

  /**
   * Initiates Refund Request to TeleBirr
   */
  public async executeRefund(params: { outTradeNo: string; refundAmount: number | string; originalTxnId?: string; reason?: string }): Promise<boolean> {
    if (this.isSandbox || process.env.NODE_ENV === 'test') {
      return true;
    }

    try {
      const payload = {
        appId: this.appId,
        shortCode: this.shortCode,
        outTradeNo: params.outTradeNo,
        refundAmount: String(params.refundAmount),
        reason: params.reason || 'TradeFlow Dispute Refund',
        timestamp: Date.now().toString(),
      };
      const signature = this.generateSignature(payload, this.appKey);
      const response = await axios.post(`${this.baseUrl}/refund`, { ...payload, signature }, { timeout: 10000 });
      return response.data?.code === 200;
    } catch (error: any) {
      console.error('[TeleBirr Service] Refund execution failed:', error.message);
      return false;
    }
  }
}

export const telebirrService = new TelebirrService();
