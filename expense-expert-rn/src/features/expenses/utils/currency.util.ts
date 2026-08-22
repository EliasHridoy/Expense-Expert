/**
 * Currency Utility
 * 
 * Provides pure, zero-drift financial calculations operating exclusively on integer cents.
 * Eliminates IEEE 754 floating-point drift in arithmetic.
 */

/**
 * Converts a monetary representation (decimal number, formatted string, or input string)
 * into safe integer cents.
 */
export function toCents(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined) {
    return 0;
  }

  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) {
      return 0;
    }
    return Math.round(amount * 100);
  }

  if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (!trimmed) {
      return 0;
    }

    const isNegative =
      trimmed.startsWith('-') ||
      trimmed.includes('-$') ||
      trimmed.includes('$-') ||
      (trimmed.startsWith('(') && trimmed.endsWith(')'));

    // Extract numbers and decimal point
    const cleaned = trimmed.replace(/[^0-9.]/g, '');
    if (!cleaned || cleaned === '.') {
      return 0;
    }

    const parts = cleaned.split('.');
    const wholeStr = parts[0] || '0';
    // If fractional part exists, pad to 2 places and take first 2 digits
    const fracStr = parts.length > 1 ? parts[1].padEnd(2, '0').slice(0, 2) : '00';

    const whole = parseInt(wholeStr, 10);
    const frac = parseInt(fracStr, 10);

    if (Number.isNaN(whole) || Number.isNaN(frac)) {
      return 0;
    }

    const totalCents = whole * 100 + frac;
    return isNegative ? -totalCents : totalCents;
  }

  return 0;
}

/**
 * Converts integer cents back to a decimal dollar number.
 */
export function fromCents(cents: number | null | undefined): number {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return 0;
  }
  return Math.round(cents) / 100;
}

/**
 * Adds two amounts in integer cents.
 */
export function addCents(a: number, b: number): number {
  const safeA = Number.isFinite(a) ? Math.round(a) : 0;
  const safeB = Number.isFinite(b) ? Math.round(b) : 0;
  return safeA + safeB;
}

/**
 * Subtracts b from a in integer cents.
 */
export function subtractCents(a: number, b: number): number {
  const safeA = Number.isFinite(a) ? Math.round(a) : 0;
  const safeB = Number.isFinite(b) ? Math.round(b) : 0;
  return safeA - safeB;
}

/**
 * Multiplies integer cents by a factor (e.g. rate or percentage), rounding strictly to nearest cent.
 */
export function multiplyCents(cents: number, factor: number): number {
  const safeCents = Number.isFinite(cents) ? cents : 0;
  const safeFactor = Number.isFinite(factor) ? factor : 0;
  return Math.round(safeCents * safeFactor);
}

/**
 * Divides integer cents by a divisor, rounding strictly to nearest cent.
 * Throws Error if divisor is 0.
 */
export function divideCents(cents: number, divisor: number): number {
  if (!divisor || !Number.isFinite(divisor) || divisor === 0) {
    throw new Error('Division by zero');
  }
  const safeCents = Number.isFinite(cents) ? cents : 0;
  return Math.round(safeCents / divisor);
}

/**
 * Formats integer cents to a localized currency string.
 */
export function formatCents(cents: number, currency: string = 'USD', locale: string = 'en-US'): string {
  const dollars = fromCents(cents);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}
