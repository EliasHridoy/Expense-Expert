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
    const sign = amount < 0 ? -1 : 1;
    return sign * Math.round(Math.abs(amount) * 100);
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

    const num = parseFloat(cleaned);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
      return 0;
    }

    const totalCents = Math.round(num * 100);
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

export type SupportedCurrency = 'BDT' | 'USD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  label: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  BDT: {
    code: 'BDT',
    symbol: '৳',
    label: 'BDT (৳) - Bangladeshi Taka',
    name: 'Bangladeshi Taka',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'USD ($) - US Dollar',
    name: 'US Dollar',
  },
};

export const DEFAULT_CURRENCY: SupportedCurrency = 'BDT';

export function getCurrencySymbol(currency?: string | null): string {
  if (!currency) return SUPPORTED_CURRENCIES.BDT.symbol;
  const upper = currency.toUpperCase();
  if (upper === 'USD') return SUPPORTED_CURRENCIES.USD.symbol;
  return SUPPORTED_CURRENCIES.BDT.symbol;
}

export function formatCurrencyAmount(amount: number, currency?: string | null): string {
  const symbol = getCurrencySymbol(currency);
  const formattedNumber = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formattedNumber}`;
}

/**
 * Formats integer cents to a localized currency string.
 */
export function formatCents(cents: number, currency: string = 'USD', locale: string = 'en-US'): string {
  const dollars = fromCents(cents);
  const upper = (currency || 'USD').toUpperCase();
  if (upper === 'BDT') {
    const formatted = Math.abs(dollars).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return dollars < 0 ? `-৳${formatted}` : `৳${formatted}`;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: upper,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

