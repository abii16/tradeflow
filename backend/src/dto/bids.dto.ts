import { z } from 'zod';

export const CreateBidSchema = z.object({
  loadId: z.string().uuid({ message: 'Invalid loadId format, must be a UUID' }),
  bidAmount: z.number().positive({ message: 'Bid amount must be a positive number' }),
  currency: z.enum(['ETB', 'USD', 'EUR']).default('ETB'),
  deliveryEta: z.string().datetime({ message: 'deliveryEta must be a valid ISO 8601 datetime string' }).optional().or(z.date().optional()),
  notes: z.string().max(1000).optional(),
});

export type CreateBidDto = z.infer<typeof CreateBidSchema>;

export const AcceptBidSchema = z.object({
  bidId: z.string().uuid({ message: 'Invalid bidId format, must be a UUID' }).optional(),
  driverId: z.string().uuid({ message: 'Invalid driverId format, must be a UUID' }).optional(),
});

export type AcceptBidDto = z.infer<typeof AcceptBidSchema>;

export const QueryBidsSchema = z.object({
  loadId: z.string().uuid().optional(),
  transporterId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']).optional(),
  limit: z.coerce.number().int().positive().default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export type QueryBidsDto = z.infer<typeof QueryBidsSchema>;
