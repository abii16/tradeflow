import crypto from 'crypto';
import { db } from '../../db';
import { payments, paymentAuditLogs, paymentDisputes } from '../../db/schema/payments';
import { shipments } from '../../db/schema/shipments';
import { loads } from '../../db/schema/loads';
import { bids } from '../../db/schema/bids';
import { users } from '../../db/schema/users';
import { eq, and, desc } from 'drizzle-orm';
import { telebirrService } from './telebirr.service';
import { CreateCheckoutDto, TelebirrWebhookDto, QueryPaymentsDto } from '../../dto/payments.dto';

export class PaymentsService {
  /**
   * Initiates C2B Checkout Session for a Shipper
   */
  public async initiateCheckout(user: { id: string; role: string }, dto: CreateCheckoutDto) {
    // 1. Fetch shipment with associated load and accepted bid
    const [shipment] = await db
      .select({
        id: shipments.id,
        loadId: shipments.loadId,
        acceptedBidId: shipments.acceptedBidId,
        transporterId: shipments.transporterId,
        driverId: shipments.driverId,
        loadShipperId: loads.shipperId,
        loadTitle: loads.title,
        bidAmount: bids.bidAmount,
        bidCurrency: bids.currency,
      })
      .from(shipments)
      .leftJoin(loads, eq(shipments.loadId, loads.id))
      .leftJoin(bids, eq(shipments.acceptedBidId, bids.id))
      .where(eq(shipments.id, dto.shipmentId));

    if (!shipment) {
      throw new Error(`Shipment ${dto.shipmentId} not found`);
    }

    // 2. Authorization check
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'FINANCE_ADMIN' && shipment.loadShipperId !== user.id) {
      throw new Error(`Forbidden: You are not the shipper for this shipment`);
    }

    if (!shipment.bidAmount) {
      throw new Error(`Shipment has no accepted bid amount`);
    }

    const totalAmount = Number(shipment.bidAmount);
    const commissionRate = 0.05; // 5% platform commission
    const commissionAmount = Number((totalAmount * commissionRate).toFixed(2));
    const netPayoutAmount = Number((totalAmount - commissionAmount).toFixed(2));

    return await db.transaction(async (tx) => {
      // 3. Check for existing payment
      const [existingPayment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.shipmentId, shipment.id))
        .for('update');

      if (existingPayment) {
        if (existingPayment.status === 'ESCROW_HELD' || existingPayment.status === 'COMPLETED') {
          throw new Error(`Payment already secured for this shipment (Status: ${existingPayment.status})`);
        }

        // Reuse existing pending payment or re-initiate checkout session
        const checkoutSession = await telebirrService.createCheckoutSession({
          outTradeNo: existingPayment.outTradeNo,
          amount: Number(existingPayment.amount),
          currency: existingPayment.currency,
          title: shipment.loadTitle || 'TradeFlow Freight Shipment',
          returnUrl: dto.returnUrl,
        });

        return {
          payment: existingPayment,
          checkoutUrl: checkoutSession.checkoutUrl,
          prepayId: checkoutSession.prepayId,
        };
      }

      // 4. Create new payment record
      const outTradeNo = `TF-PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const idempotencyKey = `IDEMP-${outTradeNo}`;

      const [newPayment] = await tx
        .insert(payments)
        .values({
          shipmentId: shipment.id,
          payerId: user.id,
          payeeId: shipment.transporterId,
          amount: totalAmount.toFixed(2),
          currency: shipment.bidCurrency || 'ETB',
          exchangeRate: '1.0000',
          amountInETB: totalAmount.toFixed(2),
          platformCommissionRate: commissionRate.toFixed(4),
          platformCommissionAmount: commissionAmount.toFixed(2),
          netPayoutAmount: netPayoutAmount.toFixed(2),
          paymentMethod: dto.paymentMethod || 'TELEBIRR',
          outTradeNo,
          idempotencyKey,
          status: 'PENDING',
          payoutStatus: 'UNSCHEDULED',
        })
        .returning();

      await tx.insert(paymentAuditLogs).values({
        paymentId: newPayment.id,
        action: 'CHECKOUT_INITIATED',
        statusBefore: 'NONE',
        statusAfter: 'PENDING',
        performedById: user.id,
        details: {
          outTradeNo,
          totalAmount,
          commissionAmount,
          netPayoutAmount,
        },
      });

      // 5. Generate TeleBirr Checkout Session
      const checkoutSession = await telebirrService.createCheckoutSession({
        outTradeNo,
        amount: totalAmount,
        currency: shipment.bidCurrency || 'ETB',
        title: shipment.loadTitle || 'TradeFlow Freight Shipment',
        returnUrl: dto.returnUrl,
      });

      return {
        payment: newPayment,
        checkoutUrl: checkoutSession.checkoutUrl,
        prepayId: checkoutSession.prepayId,
      };
    });
  }

  /**
   * Processes incoming TeleBirr Webhook Notification
   */
  public async processTelebirrWebhook(rawPayload: Record<string, any>, signatureHeader?: string) {
    // 1. Cryptographic Signature Verification
    const isSignatureValid = telebirrService.verifyWebhookSignature(rawPayload, signatureHeader);
    if (!isSignatureValid) {
      throw new Error('Unauthorized: Invalid or forged TeleBirr webhook signature');
    }

    const { outTradeNo, tradeStatus, transactionNo, totalAmount } = rawPayload as TelebirrWebhookDto;

    return await db.transaction(async (tx) => {
      // 2. Lock payment row with FOR UPDATE
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.outTradeNo, outTradeNo))
        .for('update');

      if (!payment) {
        throw new Error(`Payment with outTradeNo '${outTradeNo}' not found`);
      }

      // 3. Webhook Deduplication / Idempotency Check
      if (payment.status === 'ESCROW_HELD' || payment.status === 'COMPLETED') {
        return {
          code: 0,
          message: 'Notification already processed (idempotent duplicate)',
          paymentId: payment.id,
          status: payment.status,
        };
      }

      // 4. State Transition based on TeleBirr Status
      const isSuccess = tradeStatus === 'SUCCESS' || tradeStatus === 'COMPLETED';

      if (isSuccess) {
        const [updatedPayment] = await tx
          .update(payments)
          .set({
            status: 'ESCROW_HELD',
            telebirrTxnId: transactionNo,
            rawWebhookPayload: rawPayload,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id))
          .returning();

        await tx.insert(paymentAuditLogs).values({
          paymentId: payment.id,
          action: 'ESCROW_LOCKED',
          statusBefore: payment.status,
          statusAfter: 'ESCROW_HELD',
          details: {
            telebirrTxnId: transactionNo,
            receivedAmount: totalAmount,
            webhookTimestamp: new Date().toISOString(),
          },
        });

        return {
          code: 0,
          message: 'Escrow locked successfully',
          paymentId: updatedPayment.id,
          status: updatedPayment.status,
        };
      } else {
        const [updatedPayment] = await tx
          .update(payments)
          .set({
            status: 'FAILED',
            rawWebhookPayload: rawPayload,
            lastErrorReason: `TeleBirr reported trade status '${tradeStatus}'`,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id))
          .returning();

        await tx.insert(paymentAuditLogs).values({
          paymentId: payment.id,
          action: 'PAYMENT_FAILED',
          statusBefore: payment.status,
          statusAfter: 'FAILED',
          details: {
            tradeStatus,
            transactionNo,
          },
        });

        return {
          code: 0,
          message: 'Payment marked as failed per TeleBirr notification',
          paymentId: updatedPayment.id,
          status: updatedPayment.status,
        };
      }
    });
  }

  /**
   * Fetches payment details, audit logs, and disputes for a user.
   */
  public async getPaymentById(paymentId: string, user: { id: string; role: string }) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (
      user.role !== 'SYSTEM_ADMIN' &&
      user.role !== 'FINANCE_ADMIN' &&
      payment.payerId !== user.id &&
      payment.payeeId !== user.id
    ) {
      throw new Error(`Forbidden: You do not have permission to view this payment`);
    }

    const auditLogs = await db
      .select()
      .from(paymentAuditLogs)
      .where(eq(paymentAuditLogs.paymentId, payment.id))
      .orderBy(desc(paymentAuditLogs.createdAt));

    const disputes = await db
      .select()
      .from(paymentDisputes)
      .where(eq(paymentDisputes.paymentId, payment.id))
      .orderBy(desc(paymentDisputes.createdAt));

    return {
      payment,
      auditLogs,
      disputes,
    };
  }

  /**
   * Lists payments with role-based visibility.
   */
  public async listPayments(user: { id: string; role: string }, query: QueryPaymentsDto) {
    const conditions = [];

    if (query.shipmentId) conditions.push(eq(payments.shipmentId, query.shipmentId));
    if (query.status) conditions.push(eq(payments.status, query.status));
    if (query.payoutStatus) conditions.push(eq(payments.payoutStatus, query.payoutStatus));

    // Role-based visibility enforcement
    if (user.role === 'SHIPPER') {
      conditions.push(eq(payments.payerId, user.id));
    } else if (user.role === 'TRANSPORTER' || user.role === 'DRIVER') {
      conditions.push(eq(payments.payeeId, user.id));
    } else {
      // Admins can filter by payerId or payeeId
      if (query.payerId) conditions.push(eq(payments.payerId, query.payerId));
      if (query.payeeId) conditions.push(eq(payments.payeeId, query.payeeId));
    }

    const results = await db
      .select()
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(desc(payments.createdAt));

    return results;
  }
}

export const paymentsService = new PaymentsService();
