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
  
  // Optional role-specific fields
  companyName: z.string().optional(),
  tinNumber: z.string().optional(),
  tradeLicense: z.string().optional(),
  badgeId: z.string().optional(),
  fleetName: z.string().optional(),
  operatorLicense: z.string().optional(),
  vehicleCapacity: z.string().optional(),
}).refine((data) => {
  // Add custom validations depending on the role
  if (['SHIPPER', 'TRANSPORTER', 'FORWARDER'].includes(data.role)) {
    if (!data.companyName) return false;
    if (!data.tinNumber) return false;
    if (!data.tradeLicense) return false;
  }
  if (data.role === 'TRANSPORTER') {
    if (!data.fleetName) return false;
    if (!data.operatorLicense) return false;
    if (!data.vehicleCapacity) return false;
  }
  if (data.role === 'CUSTOMS_OFFICER' && !data.badgeId) {
    return false;
  }
  return true;
}, {
  message: "Missing mandatory fields for the selected role",
  path: ["role"] // Attach error generally
});

export const LoginDto = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterRequestType = z.infer<typeof RegisterDto>;
export type LoginRequestType = z.infer<typeof LoginDto>;
