import { db } from '../../db';
import { payments, paymentAuditLogs } from '../../db/schema/payments';
import { eq } from 'drizzle-orm';
import { telebirrService } from './telebirr.service';

export interface PayoutFailureResult {
  status: 'COMPLETED' | 'RETRYING' | 'FAILED';
  recovered?: boolean;
  retryCount?: number;
  nextRetryAt?: Date;
  rollback?: boolean;
  errorReason: string;
}

export class RetryRollbackService {
  /**
   * Handles failure of a B2C payout attempt.
   * Employs Query-Before-Retry to prevent double-spending,
   * then applies Exponential Backoff Retry up to maxRetries,
   * and triggers Rollback to Admin Review upon retry exhaustion.
   */
  public async handlePayoutFailure(paymentId: string, errorReason: string): Promise<PayoutFailureResult> {
    return await db.transaction(async (tx) => {
      // 1. Lock payment row with FOR UPDATE
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .for('update');

      if (!payment) {
        throw new Error(`Payment ${paymentId} not found during failure handling`);
      }

      // 2. Query-Before-Retry: check if TeleBirr actually processed the payout
      try {
        const queryStatus = await telebirrService.queryTransactionStatus(payment.outTradeNo);
        if (queryStatus.tradeStatus === 'SUCCESS') {
          // Reconciled successfully on remote provider!
          const [updated] = await tx
            .update(payments)
            .set({
              status: 'COMPLETED',
              payoutStatus: 'COMPLETED',
              payoutCompletedAt: new Date(),
              telebirrTxnId: queryStatus.telebirrTxnId || payment.telebirrTxnId,
              lastErrorReason: null,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id))
            .returning();

          await tx.insert(paymentAuditLogs).values({
            paymentId: payment.id,
            action: 'PAYOUT_SUCCESS_RECONCILED',
            statusBefore: payment.status,
            statusAfter: 'COMPLETED',
            details: {
              reconciliationMethod: 'QUERY_BEFORE_RETRY',
              telebirrTxnId: queryStatus.telebirrTxnId,
            },
          });

          return {
            status: 'COMPLETED',
            recovered: true,
            errorReason: 'Payment recovered via remote status query',
          };
        }
      } catch (queryErr) {
        console.warn(`[RetryRollbackService] Query status check encountered error:`, queryErr);
      }

      // 3. Check retry counter
      const currentRetries = payment.retryCount || 0;
      const maxRetries = payment.maxRetries || 3;

      if (currentRetries < maxRetries) {
        // Calculate exponential backoff delay: 60s * 2^retries (capped at 1 hour)
        const delaySeconds = Math.min(60 * Math.pow(2, currentRetries), 3600);
        const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
        const newRetryCount = currentRetries + 1;

        await tx
          .update(payments)
          .set({
            status: 'RETRYING',
            payoutStatus: 'SCHEDULED',
            retryCount: newRetryCount,
            nextRetryAt,
            lastErrorReason: errorReason,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        await tx.insert(paymentAuditLogs).values({
          paymentId: payment.id,
          action: 'PAYOUT_RETRIED',
          statusBefore: payment.status,
          statusAfter: 'RETRYING',
          details: {
            retryCount: newRetryCount,
            maxRetries,
            delaySeconds,
            nextRetryAt: nextRetryAt.toISOString(),
            errorReason,
          },
        });

        return {
          status: 'RETRYING',
          retryCount: newRetryCount,
          nextRetryAt,
          errorReason,
        };
      } else {
        // 4. Retries Exhausted: Trigger Safe Rollback to Admin Review Queue
        await tx
          .update(payments)
          .set({
            status: 'FAILED',
            payoutStatus: 'FAILED',
            lastErrorReason: `Retries exhausted (${maxRetries}/${maxRetries}): ${errorReason}`,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        await tx.insert(paymentAuditLogs).values({
          paymentId: payment.id,
          action: 'ROLLBACK_TRIGGERED',
          statusBefore: payment.status,
          statusAfter: 'FAILED',
          details: {
            retriesExhausted: true,
            totalRetries: currentRetries,
            maxRetries,
            errorReason,
            actionTaken: 'Escrow retained in platform safety ledger. Escalated to Administrator.',
          },
        });

        return {
          status: 'FAILED',
          rollback: true,
          errorReason: `Payout failed permanently after ${maxRetries} retries: ${errorReason}`,
        };
      }
    });
  }

  /**
   * Executes Refund Rollback to return escrow funds to the original payer.
   */
  public async executeRefundRollback(paymentId: string, performedById?: string, reason?: string) {
    return await db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .for('update');

      if (!payment) {
        throw new Error(`Payment ${paymentId} not found for refund`);
      }

      if (payment.status === 'COMPLETED') {
        throw new Error(`Cannot refund an already completed payout without direct debit authority`);
      }

      if (payment.status === 'REFUNDED') {
        return payment;
      }

      // Execute TeleBirr refund
      const refundSuccess = await telebirrService.executeRefund({
        outTradeNo: payment.outTradeNo,
        refundAmount: payment.amount,
        originalTxnId: payment.telebirrTxnId || undefined,
        reason: reason || 'TradeFlow Escrow Refund',
      });

      if (!refundSuccess) {
        console.warn(`[RetryRollbackService] TeleBirr remote refund returned false or failed; marking local refund.`);
      }

      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: 'REFUNDED',
          payoutStatus: 'CANCELLED',
          lastErrorReason: reason || 'Escrow refunded to shipper',
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      await tx.insert(paymentAuditLogs).values({
        paymentId: payment.id,
        action: 'REFUND_EXECUTED',
        statusBefore: payment.status,
        statusAfter: 'REFUNDED',
        performedById: performedById || null,
        details: {
          refundAmount: payment.amount,
          reason: reason || 'Refund executed',
          telebirrRefundSuccess: refundSuccess,
        },
      });

      return updatedPayment;
    });
  }

  /**
   * Manually resets retry count and re-schedules payout for an administrator.
   */
  public async manualRetryPayout(paymentId: string, performedById?: string, reason?: string) {
    return await db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .for('update');

      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      if (payment.status === 'COMPLETED' || payment.status === 'REFUNDED') {
        throw new Error(`Cannot retry payment in ${payment.status} state`);
      }

      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: 'ESCROW_HELD',
          payoutStatus: 'SCHEDULED',
          payoutScheduledAt: new Date(),
          nextRetryAt: new Date(),
          retryCount: 0,
          lastErrorReason: reason ? `Admin Retry: ${reason}` : null,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      await tx.insert(paymentAuditLogs).values({
        paymentId: payment.id,
        action: 'MANUAL_RETRY_INITIATED',
        statusBefore: payment.status,
        statusAfter: 'ESCROW_HELD',
        performedById: performedById || null,
        details: {
          resetRetryCount: true,
          reason: reason || 'Admin initiated manual payout retry',
        },
      });

      return updatedPayment;
    });
  }
}

export const retryRollbackService = new RetryRollbackService();
