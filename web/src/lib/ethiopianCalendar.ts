/**
 * Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር) Utilities
 * Provides bidirectional conversion between Ethiopian Calendar and Gregorian Calendar (ISO dates)
 * based on the astronomical Julian Day Number (JDN) algorithm.
 */

export const ETHIOPIAN_MONTHS = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
] as const;

export const ETHIOPIAN_MONTHS_EN = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miyazya',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
] as const;

export const ETHIOPIAN_DAYS = [
  'እሑድ',
  'ሰኞ',
  'ማክሰኞ',
  'ረቡዕ',
  'ሐሙስ',
  'ዓርብ',
  'ቅዳሜ',
] as const;

export const ETHIOPIAN_DAYS_SHORT = [
  'እሑ',
  'ሰኞ',
  'ማክ',
  'ረቡ',
  'ሐሙ',
  'ዓር',
  'ቅዳ',
] as const;

export interface EthiopianDate {
  year: number;
  month: number; // 1 to 13
  day: number; // 1 to 30 (or 1 to 5/6 for Pagume)
  hour: number;
  minute: number;
}

/**
 * Checks if an Ethiopian year is a leap year (ዘመነ ዮሐንስ).
 * In the Ethiopian calendar, a leap year occurs when year % 4 === 3.
 */
export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3;
}

/**
 * Returns number of days in an Ethiopian month.
 */
export function getDaysInEthiopianMonth(year: number, month: number): number {
  if (month < 1 || month > 13) return 30;
  if (month === 13) {
    return isEthiopianLeapYear(year) ? 6 : 5;
  }
  return 30;
}

/**
 * Computes Julian Day Number (JDN) from Gregorian (Y, M, D).
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Computes Ethiopian Date from Julian Day Number (JDN).
 */
export function jdnToEthiopian(jdn: number): { year: number; month: number; day: number } {
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

/**
 * Computes Julian Day Number (JDN) from Ethiopian Date (year, month 1-13, day 1-30).
 */
export function ethiopianToJDN(year: number, month: number, day: number): number {
  return (
    1723856 +
    365 * year +
    Math.floor(year / 4) +
    30 * (month - 1) +
    day -
    1
  );
}

/**
 * Computes Gregorian Date from Julian Day Number (JDN).
 */
export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/**
 * Converts a JS Date (Gregorian) to Ethiopian Date.
 */
export function toEthiopian(date: Date): EthiopianDate {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  const eth = jdnToEthiopian(jdn);
  return {
    year: eth.year,
    month: eth.month,
    day: eth.day,
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

/**
 * Converts an Ethiopian Date to JS Date (Gregorian).
 */
export function toGregorian(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  const jdn = ethiopianToJDN(year, month, day);
  const g = jdnToGregorian(jdn);
  const d = new Date(g.year, g.month - 1, g.day, hour, minute, 0, 0);
  return d;
}

/**
 * Gets day of week for an Ethiopian date (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 */
export function getEthiopianDayOfWeek(year: number, month: number, day: number): number {
  const jdn = ethiopianToJDN(year, month, day);
  return (jdn + 1) % 7;
}

/**
 * Formats an Ethiopian Date as Amharic string, e.g. "ጥቅምት 11፣ 2019 ዓ.ም. 09:30"
 */
export function formatEthiopian(
  eth: EthiopianDate,
  options: { includeTime?: boolean; amharic?: boolean } = { includeTime: true, amharic: true }
): string {
  const monthName = options.amharic
    ? ETHIOPIAN_MONTHS[eth.month - 1]
    : ETHIOPIAN_MONTHS_EN[eth.month - 1];

  let res = `${monthName} ${eth.day}፣ ${eth.year} ዓ.ም.`;
  if (options.includeTime) {
    const hh = eth.hour.toString().padStart(2, '0');
    const mm = eth.minute.toString().padStart(2, '0');
    res += ` ${hh}:${mm}`;
  }
  return res;
}

/**
 * Formats ISO date string to Ethiopian display string.
 */
export function formatIsoToEthiopian(
  isoStr: string,
  options: { includeTime?: boolean; amharic?: boolean } = { includeTime: true, amharic: true }
): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return formatEthiopian(toEthiopian(d), options);
}
