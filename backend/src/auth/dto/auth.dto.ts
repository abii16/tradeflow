import { z } from 'zod';

// Matches the userRoleEnum from db/schema/users.ts
export const RoleEnum = z.enum([
  'SHIPPER',
  'TRANSPORTER',
  'DRIVER',
  'CUSTOMS_BROKER',
  'FINANCE_ADMIN',
  'SYSTEM_ADMIN',
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
  licenseNumber: z.string().optional(),
  companyName: z.string().optional(),
}).refine((data) => {
  // Add custom validations depending on the role if needed
  if (data.role === 'DRIVER' && !data.licenseNumber) {
    return false;
  }
  return true;
}, {
  message: "licenseNumber is required for DRIVER role",
  path: ["licenseNumber"]
});

export const LoginDto = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterRequestType = z.infer<typeof RegisterDto>;
export type LoginRequestType = z.infer<typeof LoginDto>;
