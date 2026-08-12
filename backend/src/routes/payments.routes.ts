import { Router, Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateCheckoutSchema,
  TelebirrWebhookSchema,
  SchedulePayoutSchema,
  CreateDisputeSchema,
  ResolveDisputeSchema,
  RetryPayoutSchema,
  QueryPaymentsSchema,
} from '../dto/payments.dto';
import {
  paymentsService,
  payoutService,
  retryRollbackService,
  disputeService,
} from '../modules/payments';

const router = Router();

/**
 * POST /payments/checkout - Initiate TeleBirr payment checkout for a shipment
 * Requires: Authentication, Roles: SHIPPER | SYSTEM_ADMIN | FINANCE_ADMIN
 */
router.post(
  '/checkout',
  JwtAuthGuard,
  RolesGuard(['SHIPPER', 'SYSTEM_ADMIN', 'FINANCE_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = CreateCheckoutSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
        return;
      }

      const result = await paymentsService.initiateCheckout(req.user!, parsed.data);
      res.status(201).json({
        message: 'Checkout session created successfully',
        ...result,
      });
    } catch (error: any) {
      console.error('[Payments Route] Error initiating checkout:', error);
      const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: error.message || 'Failed to initiate checkout' });
    }
  }
);

/**
 * POST /payments/webhook/telebirr - Public Webhook callback from TeleBirr API
 * Security: Validates cryptographic signature, enforces idempotency
 */
router.post('/webhook/telebirr', async (req: Request, res: Response): Promise<void> => {
  try {
    const signatureHeader =
      (req.headers['telebirr-signature'] as string) ||
      (req.headers['x-signature'] as string) ||
      req.body?.signature ||
      req.body?.sign;

    const result = await paymentsService.processTelebirrWebhook(req.body, signatureHeader);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('[Payments Route] Webhook processing error:', error.message);
    if (error.message.includes('Unauthorized') || error.message.includes('Invalid') || error.message.includes('forged')) {
      res.status(401).json({ code: 401, error: 'Unauthorized: Invalid signature' });
      return;
    }
    if (error.message.includes('not found')) {
      res.status(404).json({ code: 404, error: error.message });
      return;
    }
    res.status(500).json({ code: 500, error: 'Webhook processing failed' });
  }
});

/**
 * GET /payments/disputes - List payment disputes
 * Requires: Authentication
 */
router.get('/disputes', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const disputes = await disputeService.listDisputes(req.query as any);
    res.status(200).json({ data: disputes });
  } catch (error: any) {
    console.error('[Payments Route] Error listing disputes:', error);
    res.status(500).json({ error: 'Failed to list disputes' });
  }
});

/**
 * POST /payments/disputes/:id/resolve - Admin resolves dispute
 * Requires: Authentication, Roles: SYSTEM_ADMIN | FINANCE_ADMIN
 */
router.post(
  '/disputes/:id/resolve',
  JwtAuthGuard,
  RolesGuard(['SYSTEM_ADMIN', 'FINANCE_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parsed = ResolveDisputeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
        return;
      }

      const resolved = await disputeService.resolveDispute(req.user!, id, parsed.data);
      res.status(200).json({
        message: 'Dispute resolved successfully',
        dispute: resolved,
      });
    } catch (error: any) {
      console.error('[Payments Route] Error resolving dispute:', error);
      const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: error.message || 'Failed to resolve dispute' });
    }
  }
);

/**
 * POST /payments/payouts/process-batch - Trigger processing of due payouts
 * Requires: Authentication, Roles: SYSTEM_ADMIN | FINANCE_ADMIN
 */
router.post(
  '/payouts/process-batch',
  JwtAuthGuard,
  RolesGuard(['SYSTEM_ADMIN', 'FINANCE_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const batchSize = req.body.batchSize ? Number(req.body.batchSize) : 20;
      const result = await payoutService.processPendingPayoutsBatch(batchSize);
      res.status(200).json({
        message: 'Batch payouts processed',
        ...result,
      });
    } catch (error: any) {
      console.error('[Payments Route] Error in batch payout processing:', error);
      res.status(500).json({ error: 'Failed to process batch payouts' });
    }
  }
);

/**
 * POST /payments/:id/schedule-payout - Schedule payout for a delivered shipment
 * Requires: Authentication, Roles: TRANSPORTER | DRIVER | SYSTEM_ADMIN | FINANCE_ADMIN
 */
router.post(
  '/:id/schedule-payout',
  JwtAuthGuard,
  RolesGuard(['TRANSPORTER', 'DRIVER', 'SYSTEM_ADMIN', 'FINANCE_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parsed = SchedulePayoutSchema.safeParse(req.body);
      const delayMinutes = parsed.success ? parsed.data.delayMinutes : 0;

      const scheduled = await payoutService.schedulePayoutForShipment(id, delayMinutes, req.user!.id);
      res.status(200).json({
        message: 'Payout scheduled successfully',
        payment: scheduled,
      });
    } catch (error: any) {
      console.error('[Payments Route] Error scheduling payout:', error);
      res.status(400).json({ error: error.message || 'Failed to schedule payout' });
    }
  }
);

/**
 * POST /payments/:id/retry - Manually retry a failed payout
 * Requires: Authentication, Roles: SYSTEM_ADMIN | FINANCE_ADMIN
 */
router.post(
  '/:id/retry',
  JwtAuthGuard,
  RolesGuard(['SYSTEM_ADMIN', 'FINANCE_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parsed = RetryPayoutSchema.safeParse(req.body);
      const reason = parsed.success ? parsed.data.reason : undefined;

      const retried = await retryRollbackService.manualRetryPayout(id, req.user!.id, reason);
      res.status(200).json({
        message: 'Manual retry initiated successfully',
        payment: retried,
      });
    } catch (error: any) {
      console.error('[Payments Route] Error manually retrying payout:', error);
      res.status(400).json({ error: error.message || 'Failed to retry payout' });
    }
  }
);

/**
 * POST /payments/:id/refund - Manually refund escrow payment to shipper
 * Requires: Authentication, Roles: SYSTEM_ADMIN | FINANCE_ADMIN
 */
router.post(
  '/:id/refund',
  JwtAuthGuard,
  RolesGuard(['SYSTEM_ADMIN', 'FINANCE_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reason = req.body.reason || 'Admin initiated refund';

      const refunded = await retryRollbackService.executeRefundRollback(id, req.user!.id, reason);
      res.status(200).json({
        message: 'Payment refunded successfully',
        payment: refunded,
      });
    } catch (error: any) {
      console.error('[Payments Route] Error refunding payment:', error);
      res.status(400).json({ error: error.message || 'Failed to refund payment' });
    }
  }
);

/**
 * POST /payments/:id/dispute - Raise dispute on a payment
 * Requires: Authentication, Roles: SHIPPER | TRANSPORTER | SYSTEM_ADMIN | FINANCE_ADMIN
 */
router.post(
  '/:id/dispute',
  JwtAuthGuard,
  RolesGuard(['SHIPPER', 'TRANSPORTER', 'SYSTEM_ADMIN', 'FINANCE_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parsed = CreateDisputeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
        return;
      }

      const dispute = await disputeService.raiseDispute(req.user!, {
        paymentId: id,
        reason: parsed.data.reason,
        evidenceUrl: parsed.data.evidenceUrl,
      });

      res.status(201).json({
        message: 'Dispute raised successfully. Automated payout has been frozen.',
        dispute,
      });
    } catch (error: any) {
      console.error('[Payments Route] Error raising dispute:', error);
      const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: error.message || 'Failed to raise dispute' });
    }
  }
);

/**
 * GET /payments - List payments with filters & role-based visibility
 * Requires: Authentication
 */
router.get('/', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = QueryPaymentsSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.errors });
      return;
    }

    const data = await paymentsService.listPayments(req.user!, parsed.data);
    res.status(200).json({ data });
  } catch (error: any) {
    console.error('[Payments Route] Error listing payments:', error);
    res.status(500).json({ error: 'Failed to list payments' });
  }
});

/**
 * GET /payments/:id - Get payment details, audit logs, and disputes
 * Requires: Authentication
 */
router.get('/:id', JwtAuthGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const details = await paymentsService.getPaymentById(id, req.user!);
    res.status(200).json({ data: details });
  } catch (error: any) {
    console.error('[Payments Route] Error getting payment details:', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: error.message || 'Failed to get payment details' });
  }
});

export const paymentsRoutes = router;
