// TradeFlow Mobile — East African Phone-as-Email Authentication Utilities
// Supports the full East African trade corridor:
// 🇪🇹 Ethiopia (+251), 🇩🇯 Djibouti (+253), 🇰🇪 Kenya (+254), 🇸🇴 Somalia (+252), 🇺🇬 Uganda (+256), 🇷🇼 Rwanda (+250), 🇸🇸 South Sudan (+211)

export const TRADEFLOW_DOMAIN = 'tradeflow.et';

export interface EastAfricanCountry {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
}

export const EAST_AFRICAN_COUNTRIES: EastAfricanCountry[] = [
  { code: 'ET', dialCode: '+251', flag: '🇪🇹', name: 'Ethiopia', minDigits: 9, maxDigits: 10, placeholder: '91 123 4567' },
  { code: 'DJ', dialCode: '+253', flag: '🇩🇯', name: 'Djibouti', minDigits: 8, maxDigits: 8, placeholder: '77 12 34 56' },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪', name: 'Kenya', minDigits: 9, maxDigits: 10, placeholder: '71 234 5678' },
  { code: 'SO', dialCode: '+252', flag: '🇸🇴', name: 'Somalia', minDigits: 7, maxDigits: 9, placeholder: '61 234 567' },
  { code: 'UG', dialCode: '+256', flag: '🇺🇬', name: 'Uganda', minDigits: 9, maxDigits: 10, placeholder: '70 123 4567' },
  { code: 'RW', dialCode: '+250', flag: '🇷🇼', name: 'Rwanda', minDigits: 9, maxDigits: 9, placeholder: '78 123 4567' },
  { code: 'SS', dialCode: '+211', flag: '🇸🇸', name: 'South Sudan', minDigits: 9, maxDigits: 9, placeholder: '92 123 4567' },
];

/**
 * Normalizes an East African phone number by stripping dial code, non-digits, and leading zeros.
 */
export function normalizeEastAfricanPhone(input: string, dialCode = '+251'): string {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');

  const cleanDial = dialCode.replace(/\D/g, '');
  if (digits.startsWith(cleanDial)) {
    digits = digits.slice(cleanDial.length);
  }

  // Strip leading local zero (e.g. 0911234567 -> 911234567 or 071234567 -> 71234567)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits;
}

/**
 * Checks whether an input is a valid East African mobile number.
 */
export function isValidEastAfricanPhone(input: string, dialCode = '+251'): boolean {
  const digits = normalizeEastAfricanPhone(input, dialCode);
  const country = EAST_AFRICAN_COUNTRIES.find((c) => c.dialCode === dialCode) || EAST_AFRICAN_COUNTRIES[0];

  return digits.length >= country.minDigits && digits.length <= country.maxDigits;
}

/**
 * Formats an East African phone number for human-friendly display:
 * e.g. '+251 91 123 4567' or '+253 77 12 34 56'
 */
export function formatEastAfricanPhoneDisplay(input: string, dialCode = '+251'): string {
  const digits = normalizeEastAfricanPhone(input, dialCode);
  if (!digits) return '';

  if (dialCode === '+251') {
    // 9 digits: 91 123 4567
    if (digits.length === 9) {
      return `${dialCode} ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
  } else if (dialCode === '+253') {
    // Djibouti 8 digits: 77 12 34 56
    if (digits.length === 8) {
      return `${dialCode} ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
    }
  } else if (dialCode === '+254') {
    // Kenya 9 digits: 71 234 5678
    if (digits.length === 9) {
      return `${dialCode} ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
  }

  return `${dialCode} ${digits}`;
}

/**
 * Converts a driver's phone number into standard Supabase identity email:
 * e.g. '+251', '911234567' -> '251911234567@tradeflow.et'
 * or '+253', '77123456' -> '25377123456@tradeflow.et'
 */
export function phoneToSupabaseEmail(phone: string, dialCode = '+251'): string {
  const digits = normalizeEastAfricanPhone(phone, dialCode);
  const cleanDial = dialCode.replace(/\D/g, '');
  return `${cleanDial}${digits}@${TRADEFLOW_DOMAIN}`;
}

// ── Backward-Compatible Ethiopian Helpers ──
export function normalizeEthiopianPhone(input: string): string {
  const digits = normalizeEastAfricanPhone(input, '+251');
  return digits.length ? `0${digits}` : '';
}

export function formatEthiopianPhoneDisplay(phoneOrInput: string): string {
  return formatEastAfricanPhoneDisplay(phoneOrInput, '+251');
}

export function isValidEthiopianPhone(input: string): boolean {
  return isValidEastAfricanPhone(input, '+251');
}

export function driverPhoneToSupabaseEmail(phone: string): string {
  return phoneToSupabaseEmail(phone, '+251');
}

export function isValidEmail(input: string): boolean {
  if (!input) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function resolveAuthIdentity(
  input: string,
  role: 'TRANSPORTER' | 'DRIVER',
  dialCode = '+251'
): {
  email: string;
  phone: string;
  isValid: boolean;
  errorMessage?: string;
} {
  const trimmed = input.trim();

  if (role === 'DRIVER') {
    if (!trimmed) {
      return { email: '', phone: '', isValid: false, errorMessage: 'Phone number is required' };
    }
    if (!isValidEastAfricanPhone(trimmed, dialCode)) {
      return {
        email: '',
        phone: '',
        isValid: false,
        errorMessage: 'Enter a valid East African phone number',
      };
    }
    return {
      email: phoneToSupabaseEmail(trimmed, dialCode),
      phone: formatEastAfricanPhoneDisplay(trimmed, dialCode),
      isValid: true,
    };
  }

  if (!trimmed) {
    return { email: '', phone: '', isValid: false, errorMessage: 'Email address is required' };
  }

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

  if (isValidEastAfricanPhone(trimmed, dialCode)) {
    return {
      email: phoneToSupabaseEmail(trimmed, dialCode),
      phone: formatEastAfricanPhoneDisplay(trimmed, dialCode),
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
