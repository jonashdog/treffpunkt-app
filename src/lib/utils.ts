// ============================================================
// Utility helpers
// ============================================================

import { type Locale } from '@/lib/i18n';

/**
 * Format a date for display
 */
export function formatDate(isoString: string, locale: Locale): string {
  const date = new Date(isoString);
  const lang = locale === 'de' ? 'de-DE' : 'en-US';
  return date.toLocaleDateString(lang, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Format time from ISO string (returns empty string if midnight / no time)
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const h = date.getHours();
  const m = date.getMinutes();
  if (h === 0 && m === 0) return '';
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Format date + time combined
 */
export function formatDateTime(isoString: string, locale: Locale): string {
  const datePart = formatDate(isoString, locale);
  const timePart = formatTime(isoString);
  return timePart ? `${datePart}, ${timePart} Uhr` : datePart;
}

/**
 * Get days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get day of week for first day of month (0=Mon, 6=Sun)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert Sun=0 to Mon-based
}

/**
 * Check if two dates are the same calendar day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Simple classname merge
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
