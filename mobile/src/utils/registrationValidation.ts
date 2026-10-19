// TradeFlow Mobile — Comprehensive Registration Validation & Sanitization
// Enforces strict format checks for Ethiopian transport operations:
// - Drivers: Ethiopian mobile phone (09/07), Commercial License, Truck Plate
// - Transporters: Company Name, 10-digit Ethiopian TIN, Fleet Size, Real Company Email
// - Security: Password strength, confirm match, input sanitization

import {
  normalizeEastAfricanPhone,
  formatEastAfricanPhoneDisplay,
  isValidEastAfricanPhone,
  phoneToSupabaseEmail,
  normalizeEthiopianPhone,
  formatEthiopianPhoneDisplay,
  isValidEthiopianPhone,
  driverPhoneToSupabaseEmail,
} from './phoneAuth';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized: string;
}

/**
 * Validates Full Name:
 * - 3 to 60 characters
 * - Letters, spaces, hyphens, and Ethiopian Ge'ez / Amharic script (\u1200-\u137F)
 * - Disallows pure numbers, special punctuation, or single-character gibberish
 */
export function validateFullName(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full name is required', sanitized: '' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Name must be at least 3 characters', sanitized: trimmed };
  }

  if (trimmed.length > 60) {
    return { isValid: false, error: 'Name cannot exceed 60 characters', sanitized: trimmed.slice(0, 60) };
  }

  // Regex allows English alphabet, Amharic/Ge'ez unicode, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\u1200-\u137F\s'.-]+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Name can only contain letters (English/Amharic) and spaces',
      sanitized: trimmed.replace(/[^a-zA-Z\u1200-\u137F\s'.-]/g, ''),
    };
  }

  // Ensure it has at least 2 distinct words or at least 3 valid letters
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2 && trimmed.length < 4) {
    return {
      isValid: false,
      error: 'Please enter both first and last name (e.g. Abebe Kebede)',
      sanitized: trimmed,
    };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates Transporter Company Name:
 * - 3 to 80 characters
 * - Cannot be pure numeric or symbols
 */
export function validateCompanyName(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Company name is required', sanitized: '' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Company name must be at least 3 characters', sanitized: trimmed };
  }

  if (trimmed.length > 80) {
    return { isValid: false, error: 'Company name cannot exceed 80 characters', sanitized: trimmed.slice(0, 80) };
  }

  // Reject pure numbers
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Company name cannot be numbers only', sanitized: trimmed };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates Ethiopian Tax Identification Number (TIN):
 * - Strictly 10 numeric digits (Ethiopian Ministry of Revenue standard)
 * - e.g. 0098234112
 */
export function validateTINNumber(input: string): ValidationResult {
  const digitsOnly = input.replace(/\D/g, '');
  if (!digitsOnly) {
    return { isValid: false, error: 'TIN number is required (10 digits)', sanitized: '' };
  }

  if (digitsOnly.length !== 10) {
    return {
      isValid: false,
      error: `TIN must be exactly 10 digits (${digitsOnly.length}/10 entered)`,
      sanitized: digitsOnly.slice(0, 10),
    };
  }

  return { isValid: true, sanitized: digitsOnly };
}

/**
 * Validates Fleet Size:
 * - Must be a valid positive number of trucks (1 to 10,000)
 */
export function validateFleetSize(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Fleet size is required', sanitized: '' };
  }

  const numMatch = trimmed.match(/\d+/);
  if (!numMatch) {
    return { isValid: false, error: 'Enter a valid truck count (e.g. 16 Trucks)', sanitized: trimmed };
  }

  const count = parseInt(numMatch[0], 10);
  if (isNaN(count) || count < 1) {
    return { isValid: false, error: 'Fleet size must be at least 1 truck', sanitized: trimmed };
  }

  if (count > 10000) {
    return { isValid: false, error: 'Fleet size cannot exceed 10,000 trucks', sanitized: '10000 Trucks' };
  }

  const sanitized = `${count} Trucks`;
  return { isValid: true, sanitized };
}

/**
 * Validates Real Email Address (for Transporters & Shippers):
 * - RFC 5322 compliant regex
 * - Disallows invalid characters, missing TLD, or spaces
 */
export function validateEmail(input: string): ValidationResult {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required', sanitized: '' };
  }

  // Strict email format: user@domain.tld (tld >= 2 letters)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Enter a valid email address (e.g. solomon@company.et)',
      sanitized: trimmed,
    };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates East African Mobile Phone Number (for Drivers):
 * - Supports Ethiopia (+251), Djibouti (+253), Kenya (+254), Somalia (+252), Uganda (+256), Rwanda (+250), South Sudan (+211)
 */
export function validatePhone(
  input: string,
  isOptional = false,
  dialCode = '+251'
): ValidationResult & { formatted: string; supabaseEmail: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    if (isOptional) {
      return { isValid: true, sanitized: '', formatted: '', supabaseEmail: '' };
    }
    return {
      isValid: false,
      error: 'Phone number is required',
      sanitized: '',
      formatted: '',
      supabaseEmail: '',
    };
  }

  const normalized = normalizeEastAfricanPhone(trimmed, dialCode);

  if (!isValidEastAfricanPhone(trimmed, dialCode)) {
    return {
      isValid: false,
      error: 'Enter a valid mobile phone number',
      sanitized: normalized,
      formatted: formatEastAfricanPhoneDisplay(trimmed, dialCode),
      supabaseEmail: '',
    };
  }

  return {
    isValid: true,
    sanitized: normalized,
    formatted: formatEastAfricanPhoneDisplay(trimmed, dialCode),
    supabaseEmail: phoneToSupabaseEmail(trimmed, dialCode),
  };
}

/**
 * Validates Ethiopian Commercial Truck License Plate:
 * - Format: e.g. 3-AA-98214, 3-ET-12345, 3-OR-55667
 * - Alphanumeric with hyphens/spaces, 5 to 15 characters
 */
export function validateLicensePlate(input: string): ValidationResult {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, error: 'Truck plate is required', sanitized: '' };
  }

  // Remove invalid symbols, keep letters, numbers, hyphens, and spaces
  const sanitized = trimmed.replace(/[^0-9A-Z\s-]/g, '').replace(/\s+/g, '-');

  if (sanitized.length < 5) {
    return {
      isValid: false,
      error: 'Plate must be at least 5 characters (e.g. 3-AA-98214)',
      sanitized,
    };
  }

  if (sanitized.length > 15) {
    return {
      isValid: false,
      error: 'Plate number cannot exceed 15 characters',
      sanitized: sanitized.slice(0, 15),
    };
  }

  // Must contain at least one digit and one letter (e.g. 3-AA-98214)
  if (!/\d/.test(sanitized) || !/[A-Z]/.test(sanitized)) {
    return {
      isValid: false,
      error: 'Enter a valid commercial plate (e.g. 3-AA-98214 or 3-ET-12345)',
      sanitized,
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Validates Commercial Driver's License (CDL):
 * - e.g. ETH-CDL-782190
 * - 6 to 25 alphanumeric characters
 */
export function validateDriverLicense(input: string): ValidationResult {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, error: 'Driver license number is required', sanitized: '' };
  }

  const sanitized = trimmed.replace(/[^0-9A-Z\s-]/g, '').replace(/\s+/g, '-');

  if (sanitized.length < 6) {
    return {
      isValid: false,
      error: 'License must be at least 6 characters (e.g. ETH-CDL-782190)',
      sanitized,
    };
  }

  if (sanitized.length > 25) {
    return {
      isValid: false,
      error: 'License number cannot exceed 25 characters',
      sanitized: sanitized.slice(0, 25),
    };
  }

  // Must contain digits
  if (!/\d/.test(sanitized)) {
    return {
      isValid: false,
      error: 'License must include identification numbers (e.g. ETH-CDL-782190)',
      sanitized,
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Validates Password:
 * - Minimum 6 characters
 * - No whitespace
 * - Must contain letters and numbers for safety
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  if (/\s/.test(password)) {
    return { isValid: false, error: 'Password cannot contain spaces' };
  }

  // Check for at least one number or letter to prevent single character repeats like "aaaaaa"
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must include both letters and numbers',
    };
  }

  return { isValid: true };
}

/**
 * Validates Password Confirmation:
 * - Must strictly match password
 */
export function validateConfirmPassword(password: string, confirm: string): { isValid: boolean; error?: string } {
  if (!confirm) {
    return { isValid: false, error: 'Confirm password is required' };
  }

  if (password !== confirm) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
}
