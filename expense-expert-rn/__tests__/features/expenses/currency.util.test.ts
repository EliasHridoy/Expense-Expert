import {
  toCents,
  fromCents,
  addCents,
  subtractCents,
  multiplyCents,
  divideCents,
  formatCents,
} from '../../../src/features/expenses/utils/currency.util';

describe('currency.util', () => {
  describe('toCents', () => {
    it('converts numbers to integer cents correctly', () => {
      expect(toCents(10)).toBe(1000);
      expect(toCents(10.5)).toBe(1050);
      expect(toCents(19.99)).toBe(1999);
      expect(toCents(1.15)).toBe(115);
      expect(toCents(0.01)).toBe(1);
      expect(toCents(0)).toBe(0);
      expect(toCents(-5.5)).toBe(-550);
    });

    it('converts string dollar amounts to integer cents', () => {
      expect(toCents('12.34')).toBe(1234);
      expect(toCents('$1,250.00')).toBe(125000);
      expect(toCents('$1,250.50')).toBe(125050);
      expect(toCents('.5')).toBe(50);
      expect(toCents('0.05')).toBe(5);
      expect(toCents('-5.50')).toBe(-550);
      expect(toCents('-$10.99')).toBe(-1099);
      expect(toCents('($25.00)')).toBe(-2500);
      expect(toCents('100')).toBe(10000);
    });

    it('handles edge and invalid cases gracefully', () => {
      expect(toCents(null)).toBe(0);
      expect(toCents(undefined)).toBe(0);
      expect(toCents('')).toBe(0);
      expect(toCents('-')).toBe(0);
      expect(toCents('abc')).toBe(0);
      expect(toCents(NaN)).toBe(0);
      expect(toCents(Infinity)).toBe(0);
      expect(toCents(-Infinity)).toBe(0);
    });

    it('eliminates IEEE 754 float drift in arithmetic', () => {
      // In JS: 0.1 + 0.2 = 0.30000000000000004
      const c1 = toCents(0.1);
      const c2 = toCents(0.2);
      const sum = addCents(c1, c2);
      expect(sum).toBe(30);
      expect(fromCents(sum)).toBe(0.3);
    });
  });

  describe('fromCents', () => {
    it('converts integer cents back to decimal float dollars', () => {
      expect(fromCents(1999)).toBe(19.99);
      expect(fromCents(0)).toBe(0);
      expect(fromCents(-550)).toBe(-5.5);
      expect(fromCents(125050)).toBe(1250.5);
      expect(fromCents(null)).toBe(0);
      expect(fromCents(undefined)).toBe(0);
      expect(fromCents(NaN)).toBe(0);
    });
  });

  describe('arithmetic functions', () => {
    it('addCents adds amounts safely', () => {
      expect(addCents(100, 200)).toBe(300);
      expect(addCents(1999, 1)).toBe(2000);
      expect(addCents(-100, 200)).toBe(100);
    });

    it('subtractCents subtracts amounts safely', () => {
      expect(subtractCents(300, 100)).toBe(200);
      expect(subtractCents(100, 300)).toBe(-200);
    });

    it('multiplyCents multiplies and rounds to nearest whole cent', () => {
      expect(multiplyCents(100, 1.5)).toBe(150);
      expect(multiplyCents(100, 0.333)).toBe(33);
      expect(multiplyCents(100, 0.335)).toBe(34);
    });

    it('divideCents divides and rounds to nearest whole cent', () => {
      expect(divideCents(100, 3)).toBe(33);
      expect(divideCents(200, 3)).toBe(67);
      expect(divideCents(1000, 2)).toBe(500);
    });

    it('divideCents throws on division by zero', () => {
      expect(() => divideCents(100, 0)).toThrow('Division by zero');
    });
  });

  describe('formatCents', () => {
    it('formats cents to standard currency string', () => {
      expect(formatCents(1999)).toBe('$19.99');
      expect(formatCents(0)).toBe('$0.00');
      expect(formatCents(125050)).toBe('$1,250.50');
      expect(formatCents(-500)).toBe('-$5.00');
    });
  });
});
