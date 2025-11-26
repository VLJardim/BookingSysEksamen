// src/utils/formatDate.ts
export function toDate(input: string | Date): Date | null {
  const d = input instanceof Date ? input : new Date(String(input));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date as `MM/DD/YYYY` (locale-aware).
 * - input: ISO string or Date
 * - locale: default 'en-US' (change to match your users, e.g. 'da-DK')
 */
export function formatDate(input: string | Date, locale = 'en-US'): string {
  const d = toDate(input);
  if (!d) return 'Invalid date';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Format both date + time (no seconds): `MM/DD/YYYY, HH:MM AM/PM` (locale-aware)
 */
export function formatDateTime(input: string | Date, locale = 'en-US'): string {
  const d = toDate(input);
  if (!d) return 'Invalid date';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit', // intentionally omit seconds for booking UI
  }).format(d);
}

/**
 * Short date like `Nov 24` (useful in compact UI)
 */
export function formatDateShort(input: string | Date, locale = 'en-US'): string {
  const d = toDate(input);
  if (!d) return 'Invalid date';

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Time only: `HH:MM AM/PM` (no seconds)
 */
export function formatTime(input: string | Date, locale = 'en-US'): string {
  const d = toDate(input);
  if (!d) return 'Invalid time';

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default formatDate;