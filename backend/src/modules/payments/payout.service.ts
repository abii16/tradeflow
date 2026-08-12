import { db } from '../../db';
import { payments, paymentAuditLogs } from '../../db/schema/payments';
import { users } from '../../db/schema/users';
import { shipments } from '../../db/schema/shipments';
import { eq, and, or, lte, isNull, inArray } from 'drizzle-orm';
import { telebirrService } from './telebirr.service';
import { retryRollbackService } from './retry-rollback.service';

export class PayoutService {
  /**
   * Schedules automated payout for a delivered shipment.
   */
  public async schedulePayoutForShipment(shipmentId: string, delayMinutes: number = 0, performedById?: string) {
    return await db.transaction(async (tx) => {
      // 1. Fetch payment for this shipment with FOR UPDATE lock
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.shipmentId, shipmentId))
        .for('update');

      if (!payment) {
        throw new Error(`No payment record found for shipment ${shipmentId}`);
      }

      if (payment.payoutStatus === 'COMPLETED') {
        return payment;
      }

      if (payment.status === 'DISPUTED') {
        throw new Error(`Cannot schedule payout for disputed payment`);
      }

      // Calculate commission & net payout if not yet calculated
      const amountNum = Number(payment.amountInETB || payment.amount);
      const commissionRate = Number(payment.platformCommissionRate || '0.0500');
      const commissionAmount = Number((amountNum * commissionRate).toFixed(2));
      const netPayoutAmount = Number((amountNum - commissionAmount).toFixed(2));

      const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

      const [updated] = await tx
        .update(payments)
        .set({
          platformCommissionAmount: commissionAmount.toFixed(2),
          netPayoutAmount: netPayoutAmount.toFixed(2),
          payoutStatus: 'SCHEDULED',
          payoutScheduledAt: scheduledAt,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      await tx.insert(paymentAuditLogs).values({
        paymentId: payment.id,
        action: 'PAYOUT_SCHEDULED',
        statusBefore: payment.status,
        statusAfter: payment.status,
        performedById: performedById || null,
        details: {
          scheduledAt: scheduledAt.toISOString(),
          commissionRate,
          commissionAmount,
          netPayoutAmount,
        },
      });

      return updated;
    });
  }

  /**
   * Processes a batch of due payouts.
   * Uses row-level concurrency locking (FOR UPDATE) to prevent duplicate payouts across worker threads.
   */
  public async processPendingPayoutsBatch(batchSize: number = 20): Promise<{ processed: number; succeeded: number; failed: number; retrying: number }> {
    const now = new Date();

    // 1. Select eligible payments due for payout
    const eligiblePayments = await db
      .select({
        id: payments.id,
        outTradeNo: payments.outTradeNo,
        amount: payments.amount,
        netPayoutAmount: payments.netPayoutAmount,
        payeeId: payments.payeeId,
        status: payments.status,
        payoutStatus: payments.payoutStatus,
        retryCount: payments.retryCount,
      })
      .from(payments)
      .where(
        and(
          inArray(payments.status, ['ESCROW_HELD', 'RETRYING']),
          eq(payments.payoutStatus, 'SCHEDULED'),
          or(isNull(payments.payoutScheduledAt), lte(payments.payoutScheduledAt, now)),
          or(isNull(payments.nextRetryAt), lte(payments.nextRetryAt, now))
        )
      )
      .limit(batchSize);

    let succeeded = 0;
    let failed = 0;
    let retrying = 0;

    for (const item of eligiblePayments) {
      try {
        // Process each payment in an isolated transaction
        await db.transaction(async (tx) => {
          // Re-lock payment row
          const [lockedPayment] = await tx
            .select()
            .from(payments)
            .where(eq(payments.id, item.id))
            .for('update');

          if (!lockedPayment || lockedPayment.payoutStatus !== 'SCHEDULED' || (lockedPayment.status !== 'ESCROW_HELD' && lockedPayment.status !== 'RETRYING')) {
            // Already picked up or changed status by another worker
            return;
          }

          // Mark status as PROCESSING
          await tx
            .update(payments)
            .set({
              payoutStatus: 'PROCESSING',
              updatedAt: new Date(),
            })
            .where(eq(payments.id, lockedPayment.id));

          // Fetch payee phone number
          const [payee] = await tx.select().from(users).where(eq(users.id, lockedPayment.payeeId));
          if (!payee || !payee.phone) {
            throw new Error(`Payee user ${lockedPayment.payeeId} has no registered phone number`);
          }

          const payoutAmount = lockedPayment.netPayoutAmount && Number(lockedPayment.netPayoutAmount) > 0
            ? lockedPayment.netPayoutAmount
            : lockedPayment.amount;

          // Call TeleBirr B2C Disbursement
          const result = await telebirrService.executeB2CPayout({
            outTradeNo: lockedPayment.outTradeNo,
            receiverPhone: payee.phone,
            amount: payoutAmount,
            currency: lockedPayment.currency,
            remark: `TradeFlow Transporter Payout #${lockedPayment.outTradeNo}`,
          });

          if (result.success) {
            await tx
              .update(payments)
              .set({
                status: 'COMPLETED',
                payoutStatus: 'COMPLETED',
                payoutCompletedAt: new Date(),
                telebirrTxnId: result.telebirrTxnId || lockedPayment.telebirrTxnId,
                lastErrorReason: null,
                updatedAt: new Date(),
              })
              .where(eq(payments.id, lockedPayment.id));

            await tx.insert(paymentAuditLogs).values({
              paymentId: lockedPayment.id,
              action: 'PAYOUT_SUCCESS',
              statusBefore: lockedPayment.status,
              statusAfter: 'COMPLETED',
              details: {
                telebirrTxnId: result.telebirrTxnId,
                disbursedAmount: payoutAmount,
                receiverPhone: payee.phone,
              },
            });

            succeeded++;
          } else {
            // Trigger failure retry / rollback handler
            const failureResult = await retryRollbackService.handlePayoutFailure(
              lockedPayment.id,
              result.message || 'Disbursement rejected'
            );

            if (failureResult.status === 'COMPLETED') {
              succeeded++;
            } else if (failureResult.status === 'RETRYING') {
              retrying++;
            } else {
              failed++;
            }
          }
        });
      } catch (err: any) {
        console.error(`[PayoutService] Exception processing payout ${item.id}:`, err.message);
        try {
          const failureResult = await retryRollbackService.handlePayoutFailure(item.id, err.message);
          if (failureResult.status === 'RETRYING') {
            retrying++;
          } else {
            failed++;
          }
        } catch (secondaryErr) {
          console.error(`[PayoutService] Secondary failure handling error:`, secondaryErr);
          failed++;
        }
      }
    }

    return {
      processed: eligiblePayments.length,
      succeeded,
      failed,
      retrying,
    };
  }
}

export const payoutService = new PayoutService();
