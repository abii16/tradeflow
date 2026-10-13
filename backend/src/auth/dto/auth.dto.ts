import { z } from 'zod';

// Matches the userRoleEnum from db/schema/users.ts
export const RoleEnum = z.enum([
  'SHIPPER',
  'TRANSPORTER',
  'FORWARDER',
  'CUSTOMS_OFFICER',
  'ADMIN',
]);

export const RegisterDto = z.object({
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[\W_]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Full name is too short'),
  phone: z.string().min(9, 'Phone number is too short'),
  role: RoleEnum,
  
  // Role-specific fields
  companyName: z.string().optional(),
  tinNumber: z.string().optional(),
  tradeLicense: z.string().optional(),
  badgeId: z.string().optional(),
  fleetName: z.string().optional(),
  operatorLicense: z.string().optional(),
  vehicleCapacity: z.string().optional(),
  vehicleType: z.string().optional(),
  fleetSize: z.string().optional(),
  insurancePolicy: z.string().optional(),
  customsBrokerLicense: z.string().optional(),
  customsStation: z.string().optional(),
  customsDivision: z.string().optional(),
  businessSector: z.string().optional(),
  businessAddress: z.string().optional(),
  documentUrls: z.record(z.string()).optional(),
  adminSecret: z.string().optional(),
}).refine((data) => {
  // Disallow public Admin self-registration unless verified internal adminSecret is provided
  if (data.role === 'ADMIN') {
    const internalSecret = process.env.ADMIN_REGISTRATION_SECRET || 'TF_INTERNAL_ADMIN_2026';
    if (!data.adminSecret || data.adminSecret !== internalSecret) {
      return false;
    }
  }

  // Commercial marketplace actors require legal identity & tax registration per SRS FR-01.1
  if (['SHIPPER', 'TRANSPORTER', 'FORWARDER'].includes(data.role)) {
    if (!data.companyName) return false;
    if (!data.tinNumber) return false;
    if (!data.tradeLicense) return false;
  }

  // Transporter specific fleet declarations per SRS FR-01.2
  if (data.role === 'TRANSPORTER') {
    if (!data.operatorLicense && !data.tradeLicense) return false;
    if (!data.vehicleCapacity && !data.fleetSize) return false;
  }

  // Customs Officer requires verified ECC Badge ID
  if (data.role === 'CUSTOMS_OFFICER' && !data.badgeId) {
    return false;
  }

  return true;
}, {
  message: "Missing mandatory fields for selected role, or unauthorized role registration",
  path: ["role"]
});

export const LoginDto = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const GoogleAuthDto = z.object({
  idToken: z.string().optional(),
  accessToken: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  fullName: z.string().optional(),
  role: RoleEnum.optional().default('SHIPPER'),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterRequestType = z.infer<typeof RegisterDto>;
export type LoginRequestType = z.infer<typeof LoginDto>;
export type GoogleAuthRequestType = z.infer<typeof GoogleAuthDto>;
export type RefreshTokenRequestType = z.infer<typeof RefreshTokenDto>;
