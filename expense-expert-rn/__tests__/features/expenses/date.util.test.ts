import {
  formatMonth,
  toDateInputValue,
  formatDisplayDate,
  toISODate,
  parseDate,
} from '../../../src/features/expenses/utils/date.util';

describe('date.util', () => {
  describe('parseDate', () => {
    it('handles Date instances directly', () => {
      const d = new Date(2026, 7, 23);
      expect(parseDate(d)).toBe(d);
    });

    it('handles Firestore timestamp mock objects with toDate()', () => {
      const mockTimestamp = {
        toDate: () => new Date(2026, 7, 23),
      };
      const result = parseDate(mockTimestamp);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(7);
      expect(result.getDate()).toBe(23);
    });

    it('handles epoch milliseconds and seconds numbers', () => {
      const epochMs = 1755907200000;
      expect(parseDate(epochMs).getTime()).toBe(epochMs);

      const epochSec = 1755907200;
      expect(parseDate(epochSec).getTime()).toBe(epochMs);
    });

    it('handles ISO date strings and date strings', () => {
      const parsed = parseDate('2026-08-23T12:00:00.000Z');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe('2026-08-23T12:00:00.000Z');
    });

    it('falls back gracefully on invalid inputs', () => {
      expect(parseDate(null)).toBeInstanceOf(Date);
      expect(parseDate(undefined)).toBeInstanceOf(Date);
      expect(parseDate('invalid-date-string')).toBeInstanceOf(Date);
      expect(parseDate(NaN)).toBeInstanceOf(Date);
    });
  });

  describe('formatMonth', () => {
    it('formats Date object to YYYY-MM', () => {
      const d = new Date(2026, 7, 23); // Month 7 is August (0-indexed)
      expect(formatMonth(d)).toBe('2026-08');
    });

    it('formats ISO string to YYYY-MM correctly', () => {
      expect(formatMonth('2026-01-15T00:00:00.000Z')).toBe('2026-01');
      expect(formatMonth('2026-12-31T12:00:00.000Z')).toBe('2026-12');
    });

    it('handles single-digit month padding across the year', () => {
      for (let month = 0; month < 12; month++) {
        const d = new Date(2026, month, 15);
        const expected = `2026-${String(month + 1).padStart(2, '0')}`;
        expect(formatMonth(d)).toBe(expected);
      }
    });

    it('handles leap years', () => {
      const d = new Date(2028, 1, 29); // Feb 29 2028
      expect(formatMonth(d)).toBe('2028-02');
    });
  });

  describe('toDateInputValue', () => {
    it('formats date into YYYY-MM-DD input string', () => {
      const d = new Date(2026, 7, 23);
      expect(toDateInputValue(d)).toBe('2026-08-23');
    });
  });

  describe('formatDisplayDate', () => {
    it('formats date to default readable format "MMM d, yyyy"', () => {
      const d = new Date(2026, 7, 23);
      expect(formatDisplayDate(d)).toBe('Aug 23, 2026');
    });

    it('supports custom formatting string', () => {
      const d = new Date(2026, 7, 23);
      expect(formatDisplayDate(d, 'yyyy/MM/dd')).toBe('2026/08/23');
      expect(formatDisplayDate(d, 'MMMM d, yyyy')).toBe('August 23, 2026');
    });
  });

  describe('toISODate', () => {
    it('normalizes dates to ISO string format', () => {
      const iso = '2026-08-23T00:00:00.000Z';
      expect(toISODate(iso)).toBe(iso);
    });

    it('converts Date object to ISO string', () => {
      const d = new Date('2026-08-23T10:30:00.000Z');
      expect(toISODate(d)).toBe('2026-08-23T10:30:00.000Z');
    });
  });
});
