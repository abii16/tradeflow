import { z } from 'zod';

export const LocationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  name: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const SpotPricingRequestSchema = z.object({
  origin: LocationSchema,
  destination: LocationSchema,
  cargoType: z.enum(['dry', 'bulk', 'fragile', 'hazmat', 'perishable', 'refrigerated', 'general', 'oversized']).default('dry'),
  weightKg: z.number().positive('Weight must be greater than 0'),
  volumeM3: z.number().positive().optional(),
  truckType: z.string().default('FLATBED_TRAILER'),
  urgency: z.enum(['standard', 'high', 'low']).default('standard'),
  isUrgent: z.boolean().default(false),
  pickupWindowHours: z.number().int().positive().default(24),
  customFuelPrice: z.number().positive().optional(),
  currency: z.string().default('ETB'),
  loadId: z.string().uuid().optional(),
});

export const ContractEvaluationRequestSchema = z.object({
  contractId: z.string().optional(),
  contractRate: z.number().positive('Contract rate must be greater than 0'),
  currency: z.string().default('ETB'),
  origin: LocationSchema,
  destination: LocationSchema,
  cargoType: z.string().default('dry'),
  weightKg: z.number().positive().default(20000),
  urgency: z.enum(['standard', 'high', 'low']).default('standard'),
  divergenceThresholdPercent: z.number().positive().default(15.0),
});

export type SpotPricingRequestDto = z.infer<typeof SpotPricingRequestSchema>;
export type ContractEvaluationRequestDto = z.infer<typeof ContractEvaluationRequestSchema>;
