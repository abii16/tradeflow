import { z } from 'zod';

export const SubmitVerificationSchema = z.object({
  tradeLicenseNumber: z.string().min(1, 'Trade License Number is required'),
  taxId: z.string().min(1, 'Tax ID is required'),
  documentUrls: z.record(z.string()).optional(),
  // For transporters:
  vehicleType: z.string().optional(),
  capacityTons: z.number().optional(),
  fuelType: z.string().optional(),
  insuranceDocUrl: z.string().optional(),
  roadworthinessDocUrl: z.string().optional(),
});

export const AdminReviewVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'SUSPENDED']),
  rejectionReason: z.string().optional(),
});
