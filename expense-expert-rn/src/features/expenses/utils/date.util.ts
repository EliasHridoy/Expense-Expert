import { format, isValid, parseISO } from 'date-fns';

/**
 * Date Utility
 * 
 * Provides consistent date conversions, ISO string normalization, and YYYY-MM partitioning.
 */

/**
 * Safely parses any date input (Firestore Timestamp, ISO string, epoch ms, or Date)
 * into a valid Date instance. Returns current Date as fallback.
 */
export function parseDate(value: any): Date {
  if (value === null || value === undefined) {
    return new Date();
  }

  // Handle Firestore Timestamp or object with .toDate()
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      const d = value.toDate();
      if (d instanceof Date && isValid(d)) {
        return d;
      }
    } catch {
      return new Date();
    }
  }

  // Handle Date instance
  if (value instanceof Date) {
    return isValid(value) ? value : new Date();
  }

  // Handle epoch timestamp number
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return new Date();
    }
    // Check if seconds timestamp instead of milliseconds
    const ms = value < 10000000000 ? value * 1000 : value;
    const d = new Date(ms);
    return isValid(d) ? d : new Date();
  }

  // Handle string input
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return new Date();
    }

    try {
      const parsedIso = parseISO(trimmed);
      if (isValid(parsedIso)) {
        return parsedIso;
      }
    } catch {
      // Fall through to standard Date constructor
    }

    const d = new Date(trimmed);
    return isValid(d) ? d : new Date();
  }

  return new Date();
}

/**
 * Returns partition month key in "YYYY-MM" format.
 */
export function formatMonth(date: Date | string | number): string {
  const parsed = parseDate(date);
  return format(parsed, 'yyyy-MM');
}

/**
 * Returns standard input date value in "YYYY-MM-dd" format.
 */
export function toDateInputValue(date: Date | string | number): string {
  const parsed = parseDate(date);
  return format(parsed, 'yyyy-MM-dd');
}

/**
 * Formats a date into a human-readable display string (default: "MMM d, yyyy").
 */
export function formatDisplayDate(date: Date | string | number, formatStr: string = 'MMM d, yyyy'): string {
  const parsed = parseDate(date);
  return format(parsed, formatStr);
}

/**
 * Converts any date representation to a normalized ISO 8601 string.
 */
export function toISODate(date: Date | string | number): string {
  const parsed = parseDate(date);
  return parsed.toISOString();
}
