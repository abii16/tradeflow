import { z } from 'zod';

const PointSchema = z.object({
  address: z.string(),
  city: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const CreateLoadSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  origin: PointSchema,
  destination: PointSchema,
  weightKg: z.number().positive(),
  volumeM3: z.number().positive().optional(),
  cargoType: z.string().min(2).max(100),
  budgetAmount: z.number().positive(),
  currency: z.enum(['ETB', 'USD', 'EUR']).default('ETB'),
  expiryHours: z.number().int().positive().default(48), // TTL duration in hours
});

export type CreateLoadDto = z.infer<typeof CreateLoadSchema>;

export const QueryLoadSchema = z.object({
  status: z.enum(['POSTED', 'MATCHED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED', 'CANCELLED']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  cargoType: z.string().optional(),
  limit: z.coerce.number().int().positive().default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export type QueryLoadDto = z.infer<typeof QueryLoadSchema>;

export const UpdateLoadStatusSchema = z.object({
  status: z.enum(['POSTED', 'MATCHED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED', 'CANCELLED']),
});

export type UpdateLoadStatusDto = z.infer<typeof UpdateLoadStatusSchema>;
