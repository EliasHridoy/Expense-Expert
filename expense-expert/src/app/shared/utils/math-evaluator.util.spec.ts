import { evaluateMathExpression, isMathExpression } from './math-evaluator.util';

describe('MathEvaluatorUtil', () => {
  describe('isMathExpression', () => {
    it('should identify strings starting with =', () => {
      expect(isMathExpression('=10+20')).toBeTrue();
      expect(isMathExpression(' =50 ')).toBeTrue();
    });

    it('should identify strings containing arithmetic operators', () => {
      expect(isMathExpression('10+20')).toBeTrue();
      expect(isMathExpression('10 * 5')).toBeTrue();
      expect(isMathExpression('100 / 4')).toBeTrue();
      expect(isMathExpression('10 - 5')).toBeTrue();
      expect(isMathExpression('(10 + 2)')).toBeTrue();
    });

    it('should return false for plain numbers or empty values', () => {
      expect(isMathExpression('42')).toBeFalse();
      expect(isMathExpression('42.50')).toBeFalse();
      expect(isMathExpression('')).toBeFalse();
      expect(isMathExpression(null)).toBeFalse();
      expect(isMathExpression(undefined)).toBeFalse();
    });
  });

  describe('evaluateMathExpression', () => {
    it('should evaluate basic addition', () => {
      expect(evaluateMathExpression('10+20')).toBe(30);
      expect(evaluateMathExpression('=10+20')).toBe(30);
      expect(evaluateMathExpression('= 10 + 20 ')).toBe(30);
    });

    it('should evaluate subtraction, multiplication, and division', () => {
      expect(evaluateMathExpression('50-20')).toBe(30);
      expect(evaluateMathExpression('=5*6')).toBe(30);
      expect(evaluateMathExpression('60/2')).toBe(30);
    });

    it('should respect operator precedence', () => {
      expect(evaluateMathExpression('10 + 2 * 5')).toBe(20);
      expect(evaluateMathExpression('(10 + 2) * 5')).toBe(60);
    });

    it('should handle decimals accurately without float epsilon bugs', () => {
      expect(evaluateMathExpression('0.1 + 0.2')).toBe(0.3);
      expect(evaluateMathExpression('= 12.50 + 2.75')).toBe(15.25);
    });

    it('should trim trailing operators gracefully', () => {
      expect(evaluateMathExpression('10 +')).toBe(10);
      expect(evaluateMathExpression('= 25 * ')).toBe(25);
    });

    it('should support multiple consecutive operations', () => {
      expect(evaluateMathExpression('5 + 10 + 15 + 20')).toBe(50);
      expect(evaluateMathExpression('= 100 - 10 - 20 - 30')).toBe(40);
    });

    it('should handle single numbers', () => {
      expect(evaluateMathExpression('45')).toBe(45);
      expect(evaluateMathExpression('=45')).toBe(45);
      expect(evaluateMathExpression('19.99')).toBe(19.99);
    });

    it('should return null for invalid expressions or division by zero', () => {
      expect(evaluateMathExpression('10/0')).toBeNull();
      expect(evaluateMathExpression('abc')).toBeNull();
      expect(evaluateMathExpression('++')).toBeNull();
      expect(evaluateMathExpression(null)).toBeNull();
      expect(evaluateMathExpression('')).toBeNull();
    });
  });
});
