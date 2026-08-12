import { db } from '../../db';
import { payments, paymentDisputes, paymentAuditLogs } from '../../db/schema/payments';
import { users } from '../../db/schema/users';
import { eq, desc, and } from 'drizzle-orm';
import { retryRollbackService } from './retry-rollback.service';

export interface RaiseDisputeParams {
  paymentId: string;
  reason: string;
  evidenceUrl?: string;
}

export interface ResolveDisputeParams {
  resolution: 'RESOLVED_REFUND' | 'RESOLVED_PAYOUT' | 'REJECTED';
  resolutionNotes: string;
}

export class DisputeService {
  /**
   * Raises a dispute on a payment, instantly halting scheduled payouts.
   */
  public async raiseDispute(user: { id: string; role: string }, params: RaiseDisputeParams) {
    return await db.transaction(async (tx) => {
      // 1. Lock payment row
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, params.paymentId))
        .for('update');

      if (!payment) {
        throw new Error(`Payment ${params.paymentId} not found`);
      }

      // 2. Role authorization check
      if (
        user.role !== 'SYSTEM_ADMIN' &&
        user.role !== 'FINANCE_ADMIN' &&
        payment.payerId !== user.id &&
        payment.payeeId !== user.id
      ) {
        throw new Error(`Forbidden: You are not a party to this payment transaction`);
      }

      if (payment.status === 'DISPUTED') {
        throw new Error(`Payment is already under an active dispute`);
      }

      // 3. Freeze payout & update payment status
      await tx
        .update(payments)
        .set({
          status: 'DISPUTED',
          payoutStatus: 'CANCELLED',
          lastErrorReason: `Dispute raised: ${params.reason}`,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // 4. Create dispute record
      const [dispute] = await tx
        .insert(paymentDisputes)
        .values({
          paymentId: payment.id,
          shipmentId: payment.shipmentId,
          raisedById: user.id,
          reason: params.reason,
          evidenceUrl: params.evidenceUrl,
          status: 'OPEN',
        })
        .returning();

      // 5. Insert audit log
      await tx.insert(paymentAuditLogs).values({
        paymentId: payment.id,
        action: 'DISPUTE_RAISED',
        statusBefore: payment.status,
        statusAfter: 'DISPUTED',
        performedById: user.id,
        details: {
          disputeId: dispute.id,
          reason: params.reason,
          evidenceUrl: params.evidenceUrl,
        },
      });

      return dispute;
    });
  }

  /**
   * Lists all disputes with optional filters.
   */
  public async listDisputes(filters?: { status?: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_REFUND' | 'RESOLVED_PAYOUT' | 'REJECTED'; paymentId?: string }) {
    const conditions = [];
    if (filters?.status) conditions.push(eq(paymentDisputes.status, filters.status));
    if (filters?.paymentId) conditions.push(eq(paymentDisputes.paymentId, filters.paymentId));

    return await db
      .select({
        id: paymentDisputes.id,
        paymentId: paymentDisputes.paymentId,
        shipmentId: paymentDisputes.shipmentId,
        raisedById: paymentDisputes.raisedById,
        reason: paymentDisputes.reason,
        evidenceUrl: paymentDisputes.evidenceUrl,
        status: paymentDisputes.status,
        resolutionNotes: paymentDisputes.resolutionNotes,
        resolvedById: paymentDisputes.resolvedById,
        resolvedAt: paymentDisputes.resolvedAt,
        createdAt: paymentDisputes.createdAt,
        raisedByUser: {
          email: users.email,
          fullName: users.fullName,
          role: users.role,
        },
      })
      .from(paymentDisputes)
      .leftJoin(users, eq(paymentDisputes.raisedById, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(paymentDisputes.createdAt));
  }

  /**
   * Resolves a dispute with financial action (refund shipper, release payout, or reject).
   */
  public async resolveDispute(adminUser: { id: string; role: string }, disputeId: string, params: ResolveDisputeParams) {
    if (adminUser.role !== 'SYSTEM_ADMIN' && adminUser.role !== 'FINANCE_ADMIN') {
      throw new Error(`Forbidden: Only Finance Administrators or System Administrators can resolve disputes`);
    }

    return await db.transaction(async (tx) => {
      const [dispute] = await tx
        .select()
        .from(paymentDisputes)
        .where(eq(paymentDisputes.id, disputeId))
        .for('update');

      if (!dispute) {
        throw new Error(`Dispute ${disputeId} not found`);
      }

      if (dispute.status.startsWith('RESOLVED') || dispute.status === 'REJECTED') {
        throw new Error(`Dispute is already closed with status '${dispute.status}'`);
      }

      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, dispute.paymentId))
        .for('update');

      if (!payment) {
        throw new Error(`Associated payment ${dispute.paymentId} not found`);
      }

      // Execute financial resolution
      if (params.resolution === 'RESOLVED_REFUND') {
        // Rollback funds to shipper
        await retryRollbackService.executeRefundRollback(
          payment.id,
          adminUser.id,
          `Dispute #${dispute.id} resolved in favor of shipper: ${params.resolutionNotes}`
        );
      } else if (params.resolution === 'RESOLVED_PAYOUT') {
        // Unfreeze and schedule transporter payout
        await tx
          .update(payments)
          .set({
            status: 'ESCROW_HELD',
            payoutStatus: 'SCHEDULED',
            payoutScheduledAt: new Date(),
            nextRetryAt: new Date(),
            lastErrorReason: null,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));
      } else if (params.resolution === 'REJECTED') {
        // Reject dispute and restore normal escrow state
        await tx
          .update(payments)
          .set({
            status: 'ESCROW_HELD',
            payoutStatus: 'SCHEDULED',
            lastErrorReason: `Dispute rejected: ${params.resolutionNotes}`,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));
      }

      // Update dispute record
      const [updatedDispute] = await tx
        .update(paymentDisputes)
        .set({
          status: params.resolution,
          resolutionNotes: params.resolutionNotes,
          resolvedById: adminUser.id,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentDisputes.id, dispute.id))
        .returning();

      // Insert audit log
      await tx.insert(paymentAuditLogs).values({
        paymentId: payment.id,
        action: 'DISPUTE_RESOLVED',
        statusBefore: payment.status,
        statusAfter: params.resolution === 'RESOLVED_REFUND' ? 'REFUNDED' : 'ESCROW_HELD',
        performedById: adminUser.id,
        details: {
          disputeId: dispute.id,
          resolution: params.resolution,
          notes: params.resolutionNotes,
        },
      });

      return updatedDispute;
    });
  }
}

export const disputeService = new DisputeService();
