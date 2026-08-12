import { z } from 'zod';

export const CreateCheckoutSchema = z.object({
  shipmentId: z.string().uuid('Invalid shipmentId format'),
  paymentMethod: z.enum(['TELEBIRR', 'BANK_TRANSFER', 'CASH']).default('TELEBIRR'),
  returnUrl: z.string().url('Invalid returnUrl').optional(),
});

export const TelebirrWebhookSchema = z.object({
  outTradeNo: z.string().min(1, 'outTradeNo is required'),
  msisdn: z.string().optional(),
  totalAmount: z.union([z.string(), z.number()]).transform((val) => String(val)),
  tradeDate: z.string().optional(),
  tradeStatus: z.string().min(1, 'tradeStatus is required'), // 'SUCCESS', 'COMPLETED', 'FAILED'
  transactionNo: z.string().min(1, 'transactionNo is required'),
  signature: z.string().optional(),
  sign: z.string().optional(),
  tradeTime: z.string().optional(),
});

export const SchedulePayoutSchema = z.object({
  paymentId: z.string().uuid().optional(),
  delayMinutes: z.number().int().nonnegative().optional().default(0),
});

export const CreateDisputeSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  evidenceUrl: z.string().url('Invalid evidenceUrl').optional(),
});

export const ResolveDisputeSchema = z.object({
  resolution: z.enum(['RESOLVED_REFUND', 'RESOLVED_PAYOUT', 'REJECTED']),
  resolutionNotes: z.string().min(3, 'Resolution notes are required'),
});

export const RetryPayoutSchema = z.object({
  reason: z.string().optional(),
});

export const QueryPaymentsSchema = z.object({
  shipmentId: z.string().uuid().optional(),
  payerId: z.string().uuid().optional(),
  payeeId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'ESCROW_HELD', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED', 'RETRYING']).optional(),
  payoutStatus: z.enum(['UNSCHEDULED', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type CreateCheckoutDto = z.infer<typeof CreateCheckoutSchema>;
export type TelebirrWebhookDto = z.infer<typeof TelebirrWebhookSchema>;
export type SchedulePayoutDto = z.infer<typeof SchedulePayoutSchema>;
export type CreateDisputeDto = z.infer<typeof CreateDisputeSchema>;
export type ResolveDisputeDto = z.infer<typeof ResolveDisputeSchema>;
export type RetryPayoutDto = z.infer<typeof RetryPayoutSchema>;
export type QueryPaymentsDto = z.infer<typeof QueryPaymentsSchema>;
