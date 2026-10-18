// TradeFlow Mobile — Phone-as-Email Authentication Utilities
// Spec:
// - Shippers & Transporters: Real email (e.g. solomon@company.et)
// - Truck Drivers: Phone number (e.g. 0911234567) mapped to Supabase email identity (0911234567@tradeflow.et)
// Zero SMS fees; standard Supabase email identity processed behind the scenes.

export const TRADEFLOW_DOMAIN = 'tradeflow.et';

/**
 * Normalizes an Ethiopian phone number to local 10-digit format:
 * Examples:
 *   '0911234567'       -> '0911234567'
 *   '911234567'        -> '0911234567'
 *   '+251 91 123 4567' -> '0911234567'
 *   '251911234567'     -> '0911234567'
 *   '0711234567'       -> '0711234567' (Safaricom Ethiopia)
 *   '711234567'        -> '0711234567'
 */
export function normalizeEthiopianPhone(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');

  // Strip international country code 251 if present
  let local = digits.startsWith('251') ? digits.slice(3) : digits;

  // If already starts with 0 (e.g. 09... or 07...)
  if (local.startsWith('0')) {
    return local.slice(0, 10);
  }

  // If 9 digits starting with 9 or 7, prepend leading 0
  if (local.length >= 9) {
    const core9 = local.slice(-9);
    return `0${core9}`;
  }

  return local;
}

/**
 * Formats an Ethiopian phone number for human-friendly display:
 * Example: '0911234567' -> '+251 91 123 4567'
 */
export function formatEthiopianPhoneDisplay(phoneOrInput: string): string {
  const normalized = normalizeEthiopianPhone(phoneOrInput);
  if (normalized.length === 10 && normalized.startsWith('0')) {
    const operator = normalized.slice(1, 3); // '91' or '71'
    const block1 = normalized.slice(3, 6);   // '123'
    const block2 = normalized.slice(6, 10);  // '4567'
    return `+251 ${operator} ${block1} ${block2}`;
  }
  return phoneOrInput.trim();
}

/**
 * Checks whether an input is a valid 9 or 10-digit Ethiopian mobile number.
 */
export function isValidEthiopianPhone(input: string): boolean {
  const normalized = normalizeEthiopianPhone(input);
  // Ethiopian mobile numbers start with 09 (Ethio Telecom) or 07 (Safaricom)
  return /^(09|07)\d{8}$/.test(normalized);
}

/**
 * Checks whether an input is a valid email address.
 */
export function isValidEmail(input: string): boolean {
  if (!input) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

/**
 * Converts a driver's phone number into their standard Supabase identity email:
 * e.g. '0911234567' -> '0911234567@tradeflow.et'
 */
export function driverPhoneToSupabaseEmail(phone: string): string {
  const normalized = normalizeEthiopianPhone(phone);
  return `${normalized}@${TRADEFLOW_DOMAIN}`;
}

/**
 * Resolves authentication credentials to Supabase identity:
 * - DRIVER: Map phone (0911234567) -> 0911234567@tradeflow.et
 * - TRANSPORTER: Real email (solomon@company.et)
 */
export function resolveAuthIdentity(
  input: string,
  role: 'TRANSPORTER' | 'DRIVER'
): {
  email: string;
  phone: string;
  isValid: boolean;
  errorMessage?: string;
} {
  const trimmed = input.trim();

  if (role === 'DRIVER') {
    // Driver mode: Only phone numbers allowed
    if (!trimmed) {
      return { email: '', phone: '', isValid: false, errorMessage: 'Phone number is required' };
    }
    if (!isValidEthiopianPhone(trimmed)) {
      return {
        email: '',
        phone: '',
        isValid: false,
        errorMessage: 'Enter a valid 10-digit phone (e.g. 0911234567)',
      };
    }
    const normalizedPhone = normalizeEthiopianPhone(trimmed);
    return {
      email: driverPhoneToSupabaseEmail(normalizedPhone),
      phone: formatEthiopianPhoneDisplay(normalizedPhone),
      isValid: true,
    };
  }

  // Transporter mode: Real email required
  if (!trimmed) {
    return { email: '', phone: '', isValid: false, errorMessage: 'Email address is required' };
  }

  // If user entered real email
  if (trimmed.includes('@')) {
    if (!isValidEmail(trimmed)) {
      return {
        email: '',
        phone: '',
        isValid: false,
        errorMessage: 'Enter a valid email address (e.g. solomon@company.et)',
      };
    }
    return {
      email: trimmed.toLowerCase(),
      phone: '',
      isValid: true,
    };
  }

  // Transporter fallback if phone was entered instead of email
  if (isValidEthiopianPhone(trimmed)) {
    const normalized = normalizeEthiopianPhone(trimmed);
    return {
      email: `${normalized}@${TRADEFLOW_DOMAIN}`,
      phone: formatEthiopianPhoneDisplay(normalized),
      isValid: true,
    };
  }

  return {
    email: '',
    phone: '',
    isValid: false,
    errorMessage: 'Enter your company email address (e.g. solomon@company.et)',
  };
}
