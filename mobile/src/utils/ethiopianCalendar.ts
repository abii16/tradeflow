// TradeFlow Mobile — Ethiopian Calendar (EC) & Ethiopian 12-Hour Time Utilities
// Provides precise Gregorian (GC) <-> Ethiopian (EC / ዓ.ም) conversion and 12-hour dual time formatting.

export const ETH_MONTHS_AM = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ',
] as const;

export const ETH_MONTHS_EN = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume',
] as const;

export const DAYS_AM = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'] as const;
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const GC_MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
  monthNameAm: string;
  monthNameEn: string;
  dayOfWeekAm: string;
  dayOfWeekEn: string;
}

export interface EthiopianTime {
  ethHour: number;
  minutes: number;
  periodAm: string; // ጠዋት, ከሰዓት, ምሽት, ሌሊት
  ethTimeStr: string; // e.g. "ጠዋት 12:00 ሰዓት"
  gcHour: number;
  gcPeriod: 'AM' | 'PM';
  gcTimeStr: string; // e.g. "06:00 AM"
}

/**
 * Astronomical Julian Day Number calculation for Gregorian date (Y, M, D)
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
 * Converts a JS Date to Ethiopian Calendar date (ዓመተ ምሕረት / EC)
 */
export function toEthiopianDate(date: Date): EthiopianDate {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const jdn = gregorianToJDN(y, m, d);

  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ethYear =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;
  const dayOfWeek = date.getDay();

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameAm: ETH_MONTHS_AM[ethMonth - 1] || 'መስከረም',
    monthNameEn: ETH_MONTHS_EN[ethMonth - 1] || 'Meskerem',
    dayOfWeekAm: DAYS_AM[dayOfWeek] || '',
    dayOfWeekEn: DAYS_EN[dayOfWeek] || '',
  };
}

/**
 * Converts Gregorian 24hr time (hours, minutes) to Ethiopian 12-hour time and GC 12-hour AM/PM
 * In Ethiopia:
 * 06:00 GC = 12:00 ጠዋት (Dawn)
 * 07:00 GC = 1:00 ጠዋት
 * 12:00 GC = 6:00 ቀን / ከሰዓት (Noon)
 * 14:00 GC = 8:00 ከሰዓት
 * 18:00 GC = 12:00 ምሽት (Dusk)
 * 00:00 GC = 6:00 ሌሊት (Midnight)
 */
export function toEthiopianTime(hours: number, minutes: number): EthiopianTime {
  let ethHour = (hours - 6) % 12;
  if (ethHour <= 0) ethHour += 12;

  let periodAm = '';
  if (hours >= 6 && hours < 12) {
    periodAm = 'ጠዋት';
  } else if (hours >= 12 && hours < 18) {
    periodAm = 'ከሰዓት';
  } else if (hours >= 18 && hours < 24) {
    periodAm = 'ምሽት';
  } else {
    periodAm = 'ሌሊት';
  }

  const mm = minutes.toString().padStart(2, '0');
  const ethTimeStr = `${periodAm} ${ethHour}:${mm} ሰዓት`;

  const gcPeriod: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  let gcHour = hours % 12;
  if (gcHour === 0) gcHour = 12;
  const gcTimeStr = `${gcHour.toString().padStart(2, '0')}:${mm} ${gcPeriod}`;

  return {
    ethHour,
    minutes,
    periodAm,
    ethTimeStr,
    gcHour,
    gcPeriod,
    gcTimeStr,
  };
}

/**
 * Parses date strings like '2026-08-20 06:00' or ISO strings
 */
export function parseDate(str: string): Date {
  if (!str) return new Date();
  const trimmed = str.trim();
  const parts = trimmed.split(' ');
  if (parts.length >= 2 && parts[0].includes('-')) {
    const [dPart, tPart] = parts;
    const [yr, mo, da] = dPart.split('-').map(Number);
    const [hr, mi] = (tPart || '00:00').split(':').map(Number);
    return new Date(yr, (mo || 1) - 1, da || 1, hr || 0, mi || 0);
  }
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export interface PickupDetails {
  dayOfWeekAm: string;
  dayOfWeekEn: string;
  ecDate: string; // e.g. "ሐሙስ ነሐሴ 14, 2018 ዓ.ም (EC)"
  ecDatePlain: string; // e.g. "ሐሙስ ነሐሴ 14, 2018 ዓ.ም"
  ecTime: string; // e.g. "ጠዋት 12:00 ሰዓት"
  gcDate: string; // e.g. "Thu, Aug 20, 2026 (GC)"
  gcDatePlain: string; // e.g. "Thu, Aug 20, 2026"
  gcTime: string; // e.g. "06:00 AM"
  periodAm: string; // "ጠዋት", "ከሰዓት", "ምሽት", "ሌሊት"
  gcPeriod: 'AM' | 'PM';
  combinedSummary: string;
}

/**
 * Returns structured pickup date and time breakdown in both EC and GC, with 12h Amharic and 12h AM/PM
 */
export function formatPickupDetails(pickupStr: string, language: 'EN' | 'AM'): PickupDetails {
  const d = parseDate(pickupStr);
  const ethDate = toEthiopianDate(d);
  const ethTime = toEthiopianTime(d.getHours(), d.getMinutes());

  const gcMonth = GC_MONTHS_EN[d.getMonth()];
  const gcDay = d.getDate();
  const gcYear = d.getFullYear();
  const gcDayOfWeek = DAYS_EN[d.getDay()];

  const ecDatePlain =
    language === 'AM'
      ? `${ethDate.monthNameAm} ${ethDate.day}, ${ethDate.year} ዓ.ም`
      : `${ethDate.monthNameEn} ${ethDate.day}, ${ethDate.year}`;
  const ecDate = `${ecDatePlain} (EC)`;
  const ecTime = ethTime.ethTimeStr;

  const gcDatePlain = `${gcMonth} ${gcDay}, ${gcYear}`;
  const gcDate = `${gcDatePlain} (GC)`;
  const gcTime = ethTime.gcTimeStr;

  const combinedSummary =
    language === 'AM'
      ? `${ecDatePlain} (${ecTime})`
      : `${gcDatePlain} • ${gcTime}`;

  return {
    dayOfWeekAm: ethDate.dayOfWeekAm,
    dayOfWeekEn: gcDayOfWeek,
    ecDate,
    ecDatePlain,
    ecTime,
    gcDate,
    gcDatePlain,
    gcTime,
    periodAm: ethTime.periodAm,
    gcPeriod: ethTime.gcPeriod,
    combinedSummary,
  };
}

/**
 * Formats Pickup Time Window with language-specific calendar:
 * AM: "ነሐሴ 14, 2018 ዓ.ም (ጠዋት 12:00 ሰዓት)" (Only Ethiopian Calendar)
 * EN: "Aug 20, 2026 • 06:00 AM" (Only European/Gregorian Calendar)
 */
export function formatPickupWindow(pickupStr: string, language: 'EN' | 'AM'): string {
  const details = formatPickupDetails(pickupStr, language);
  return details.combinedSummary;
}

/**
 * Short representation of Pickup Time for compact cards
 */
export function formatPickupShort(pickupStr: string, language: 'EN' | 'AM'): {
  dateLabel: string;
  timeLabel: string;
  dualLabel: string;
} {
  const details = formatPickupDetails(pickupStr, language);

  if (language === 'AM') {
    return {
      dateLabel: details.ecDatePlain,
      timeLabel: details.ecTime,
      dualLabel: `${details.ecDatePlain} (${details.ecTime})`,
    };
  }

  return {
    dateLabel: details.gcDatePlain,
    timeLabel: details.gcTime,
    dualLabel: `${details.gcDatePlain} • ${details.gcTime}`,
  };
}

/**
 * Formats relative time (time ago) in English or Amharic
 */
export function formatTimeAgo(isoStr: string, language: 'EN' | 'AM'): string {
  const d = parseDate(isoStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));

  if (language === 'AM') {
    if (mins < 60) return `ከ ${mins} ደቂቃ በፊት`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `ከ ${hrs} ሰዓት በፊት`;
    const days = Math.floor(hrs / 24);
    return `ከ ${days} ቀን በፊት`;
  }

  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Formats a waypoint timestamp like "Today, 06:15 AM" or ISO string
 */
export function formatWaypointTimestamp(ts: string, language: 'EN' | 'AM'): string {
  if (!ts) return '';

  // Extract hours and minutes if string has format "HH:MM AM/PM"
  const match = ts.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hr = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm === 'PM' && hr < 12) hr += 12;
    if (ampm === 'AM' && hr === 12) hr = 0;

    const ethTime = toEthiopianTime(hr, min);

    if (language === 'AM') {
      return ethTime.ethTimeStr;
    }

    const isToday = ts.toLowerCase().includes('today') || ts.includes('ዛሬ');
    const dayPrefix = isToday ? 'Today, ' : '';
    return `${dayPrefix}${ethTime.gcTimeStr}`;
  }

  return ts;
}

/**
 * Returns the current date and time header in EC and GC
 */
export function getCurrentCorridorDateTime(language: 'EN' | 'AM'): {
  primaryDate: string;
  secondaryDate: string;
  primaryTime: string;
  secondaryTime: string;
  ecDateLabel: string;
  gcDateLabel: string;
  ecTimeLabel: string;
  gcTimeLabel: string;
  fullBadge: string;
} {
  const now = new Date();
  const ethDate = toEthiopianDate(now);
  const ethTime = toEthiopianTime(now.getHours(), now.getMinutes());

  const gcMonth = GC_MONTHS_EN[now.getMonth()];
  const gcDay = now.getDate();
  const gcYear = now.getFullYear();
  const gcDayOfWeek = DAYS_EN[now.getDay()];
  const ecDateStr =
    language === 'AM'
      ? `${ethDate.monthNameAm} ${ethDate.day}, ${ethDate.year} ዓ.ም (EC)`
      : `${ethDate.dayOfWeekAm} ${ethDate.monthNameAm} ${ethDate.day}, ${ethDate.year} ዓ.ም (EC)`;
  const gcDateStr =
    language === 'AM'
      ? `${gcMonth} ${gcDay}, ${gcYear} (GC)`
      : `${gcDayOfWeek}, ${gcMonth} ${gcDay}, ${gcYear} (GC)`;
  const ecTimeStr = `${ethTime.ethTimeStr}`;
  const gcTimeStr = `${ethTime.gcTimeStr} (GC)`;

  if (language === 'AM') {
    return {
      primaryDate: `EC: ${ethDate.monthNameAm} ${ethDate.day}, ${ethDate.year} ዓ.ም`,
      secondaryDate: `GC: ${gcMonth} ${gcDay}, ${gcYear}`,
      primaryTime: ethTime.ethTimeStr,
      secondaryTime: '',
      ecDateLabel: ecDateStr,
      gcDateLabel: gcDateStr,
      ecTimeLabel: ecTimeStr,
      gcTimeLabel: '',
      fullBadge: `EC: ${ethDate.monthNameAm} ${ethDate.day}, ${ethDate.year} ዓ.ም (${ethTime.ethTimeStr}) • GC: ${gcMonth} ${gcDay}`,
    };
  }

  return {
    primaryDate: `GC: ${gcDayOfWeek}, ${gcMonth} ${gcDay}, ${gcYear}`,
    secondaryDate: `EC: ${ethDate.dayOfWeekEn}, ${ethDate.monthNameEn} ${ethDate.day}, ${ethDate.year}`,
    primaryTime: `${ethTime.gcTimeStr} (GC)`,
    secondaryTime: ethTime.ethTimeStr,
    ecDateLabel: ecDateStr,
    gcDateLabel: gcDateStr,
    ecTimeLabel: ecTimeStr,
    gcTimeLabel: gcTimeStr,
    fullBadge: `GC: ${gcMonth} ${gcDay}, ${gcYear} (${ethTime.gcTimeStr}) • EC: ${ethDate.monthNameEn} ${ethDate.day} (${ethTime.ethTimeStr})`,
  };
}
