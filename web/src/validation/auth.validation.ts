/**
 * Authentication and Registration Validation Rules
 * Aligned with backend Zod validation schemas
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  rules: {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
  };
}

export interface BusinessDetailsErrors {
  role?: string;
  companyName?: string;
  taxId?: string;
  licenseNumber?: string;
}

/**
 * Validates full name (must be at least 2 characters)
 */
export function validateFullName(name: string): ValidationResult {
  if (!name || name.trim().length < 2) {
    return { isValid: false, message: 'Please enter your full name (at least 2 characters).' };
  }
  return { isValid: true };
}

/**
 * Validates standard email address format
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }
  return { isValid: true };
}

/**
 * Validates local phone number (must contain at least 8 numeric digits)
 */
export function validatePhone(phone: string): ValidationResult {
  const numericOnly = (phone || '').replace(/[^0-9]/g, '');
  if (numericOnly.length < 8) {
    return { isValid: false, message: 'Please enter a valid phone number (at least 8 digits).' };
  }
  return { isValid: true };
}

/**
 * Validates password against security complexity requirements:
 * - 8+ characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const val = password || '';
  const rules = {
    length: val.length >= 8,
    upper: /[A-Z]/.test(val),
    lower: /[a-z]/.test(val),
    number: /[0-9]/.test(val),
    special: /[\W_]/.test(val),
  };

  const isValid = Object.values(rules).every(Boolean);

  return {
    isValid,
    rules,
    message: isValid
      ? undefined
      : 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol.',
  };
}

/**
 * Validates role-specific business credentials:
 * - Shipper / Transporter / Forwarder: Company name, TIN, and Trade license
 * - Customs: Badge ID
 */
export function validateBusinessDetails(
  role: string | null,
  formData: { companyName?: string; taxId?: string; licenseNumber?: string }
): { isValid: boolean; errors: BusinessDetailsErrors } {
  const errors: BusinessDetailsErrors = {};

  if (!role) {
    errors.role = 'Please select an organization role.';
  }

  if (role && ['shipper', 'transporter', 'forwarder'].includes(role)) {
    if (!formData.companyName || !formData.companyName.trim()) {
      errors.companyName = 'Company name is required.';
    }
    if (!formData.taxId || !formData.taxId.trim()) {
      errors.taxId = 'Tax ID (TIN) is required.';
    }
    if (!formData.licenseNumber || !formData.licenseNumber.trim()) {
      errors.licenseNumber = 'Trade license is required.';
    }
  }

  if (role === 'customs') {
    if (!formData.taxId || !formData.taxId.trim()) {
      errors.taxId = 'Customs Badge ID is required.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
