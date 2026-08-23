import {
  resolveSalaryInCents,
  getMonthsBetween,
  computeMonthSummary,
  computeCategoryBreakdown,
  computeMonthlyTrend,
  getPastMonthKeys,
} from '../../../src/features/dashboard/utils/aggregation.util';
import { RawFinancialData } from '../../../src/features/dashboard/types/dashboard.types';

describe('aggregation.util', () => {
  describe('resolveSalaryInCents', () => {
    it('returns 0 if profile is null or undefined', () => {
      expect(resolveSalaryInCents(null, '2026-08')).toBe(0);
      expect(resolveSalaryInCents(undefined, '2026-08')).toBe(0);
    });

    it('returns exact match from salaries map if present', () => {
      const profile = {
        monthlySalary: 3000,
        salaries: {
          '2026-01': 3000,
          '2026-06': 3500.5,
          '2026-08': 4000,
        },
      };
      expect(resolveSalaryInCents(profile, '2026-06')).toBe(350050);
      expect(resolveSalaryInCents(profile, '2026-08')).toBe(400000);
    });

    it('finds closest preceding historical step when target month is not directly in salaries map', () => {
      const profile = {
        monthlySalary: 2000,
        salaries: {
          '2025-01': 3000,
          '2025-06': 3500,
          '2026-01': 4000,
        },
      };
      // For 2025-08, closest before is 2025-06 (3500)
      expect(resolveSalaryInCents(profile, '2025-08')).toBe(350000);
      // For 2026-05, closest before is 2026-01 (4000)
      expect(resolveSalaryInCents(profile, '2026-05')).toBe(400000);
    });

    it('returns earliest mapped salary if target month is before all historical steps', () => {
      const profile = {
        monthlySalary: 2500,
        salaries: {
          '2025-06': 3500,
          '2026-01': 4000,
        },
      };
      expect(resolveSalaryInCents(profile, '2024-01')).toBe(350000);
    });

    it('falls back to monthlySalary if salaries map is empty or undefined', () => {
      expect(resolveSalaryInCents({ monthlySalary: 4500.25 }, '2026-08')).toBe(450025);
      expect(resolveSalaryInCents({ monthlySalary: 5000, salaries: {} }, '2026-08')).toBe(500000);
      expect(resolveSalaryInCents({}, '2026-08')).toBe(0);
    });
  });

  describe('getMonthsBetween', () => {
    it('returns all intermediate months in chronological order within the same year', () => {
      const start = new Date(2026, 0, 15); // 2026-01
      const result = getMonthsBetween(start, '2026-05');
      expect(result).toEqual(['2026-01', '2026-02', '2026-03', '2026-04']);
    });

    it('handles spans crossing multiple year boundaries', () => {
      const start = '2024-11-10T00:00:00.000Z';
      const result = getMonthsBetween(start, '2025-03');
      expect(result).toEqual(['2024-11', '2024-12', '2025-01', '2025-02']);
    });

    it('returns empty array if start month equals end month', () => {
      const start = new Date(2026, 7, 1); // 2026-08
      const result = getMonthsBetween(start, '2026-08');
      expect(result).toEqual([]);
    });

    it('returns empty array if start month is after end month', () => {
      const start = new Date(2026, 8, 1); // 2026-09
      const result = getMonthsBetween(start, '2026-05');
      expect(result).toEqual([]);
    });

    it('handles invalid inputs gracefully', () => {
      expect(getMonthsBetween('invalid-date', '2026-05')).toEqual([]);
      expect(getMonthsBetween(new Date(NaN), '2026-05')).toEqual([]);
      expect(getMonthsBetween(new Date(), 'invalid-end')).toEqual([]);
    });
  });

  describe('computeMonthSummary', () => {
    it('calculates current month basic summary accurately in integer cents with zero drift', () => {
      const data: RawFinancialData = {
        month: '2026-08',
        profile: {
          monthlySalary: 3000.1, // 300010 cents
          createdAt: '2026-08-01T00:00:00.000Z',
        },
        expenses: [
          { month: '2026-08', category: 'Food', amount: 50.2 }, // 5020 cents
          { month: '2026-08', category: 'Transport', amountInCents: 2530 }, // 2530 cents
        ],
        savingEntries: [
          { month: '2026-08', type: 'deposit', amount: 200.05 }, // 20005 cents
        ],
        incomeEntries: [
          { month: '2026-08', amount: 100.15 }, // 10015 cents
        ],
        loansTaken: [
          { month: '2026-08', amount: 500.0 }, // 50000 cents
        ],
      };

      const summary = computeMonthSummary(data);

      // currentMonthIncome = 300010 + 10015 + 50000 = 360025
      expect(summary.currentMonthIncomeInCents).toBe(360025);
      expect(summary.currentMonthIncome).toBe(3600.25);
      expect(summary.loansTakenIncomeInCents).toBe(50000);
      expect(summary.loansTakenIncome).toBe(500);

      // previousMonthRemaining = 0 (created in 2026-08)
      expect(summary.previousMonthRemainingInCents).toBe(0);
      expect(summary.previousMonthRemaining).toBe(0);

      // totalIncome = 360025
      expect(summary.totalIncomeInCents).toBe(360025);
      expect(summary.totalIncome).toBe(3600.25);

      // totalExpenses = 5020 + 2530 = 7550
      expect(summary.totalExpensesInCents).toBe(7550);
      expect(summary.totalExpenses).toBe(75.5);
      expect(summary.expenseCount).toBe(2);

      // totalSavings = 20005
      expect(summary.totalSavingsInCents).toBe(20005);
      expect(summary.totalSavings).toBe(200.05);

      // remaining = totalIncome - totalExpenses - (totalSavings - savingsInExpenses)
      // remaining = 360025 - 7550 - 20005 = 332470
      expect(summary.remainingInCents).toBe(332470);
      expect(summary.remaining).toBe(3324.7);
    });

    it('deduplicates savings expenses to prevent double deduction in net remaining', () => {
      const data: RawFinancialData = {
        month: '2026-08',
        profile: {
          monthlySalary: 2000,
          createdAt: '2026-08-01T00:00:00.000Z',
        },
        expenses: [
          { month: '2026-08', category: 'General', amount: 300 },
          { month: '2026-08', category: 'Savings', amount: 500 }, // Savings expense
        ],
        savingEntries: [
          { month: '2026-08', type: 'deposit', amount: 500 }, // 500 deposit
        ],
        incomeEntries: [],
        loansTaken: [],
      };

      const summary = computeMonthSummary(data);

      expect(summary.totalExpensesInCents).toBe(80000); // 300 + 500
      expect(summary.totalSavingsInCents).toBe(50000); // 500
      // netSavingsDeduction = totalSavings (500) - savingsInExpenses (500) = 0
      // remaining = 2000 - 800 - 0 = 1200
      expect(summary.remainingInCents).toBe(120000);
      expect(summary.remaining).toBe(1200);
    });

    it('correctly handles savings withdrawals', () => {
      const data: RawFinancialData = {
        month: '2026-08',
        profile: {
          monthlySalary: 1000,
          createdAt: '2026-08-01T00:00:00.000Z',
        },
        expenses: [{ month: '2026-08', category: 'Bills', amount: 200 }],
        savingEntries: [
          { month: '2026-08', type: 'withdrawal', amount: 300 },
        ],
        incomeEntries: [],
        loansTaken: [],
      };

      const summary = computeMonthSummary(data);

      expect(summary.totalSavingsInCents).toBe(-30000);
      // remaining = 1000 - 200 - (-300 - 0) = 800 - (-300) = 1100
      expect(summary.remainingInCents).toBe(110000);
      expect(summary.remaining).toBe(1100);
    });

    it('rolls forward past remaining balance across multiple historical months', () => {
      const data: RawFinancialData = {
        month: '2026-08',
        profile: {
          monthlySalary: 2000,
          createdAt: '2026-06-01T00:00:00.000Z', // 2 past months: 2026-06, 2026-07
          salaries: {
            '2026-06': 1800,
            '2026-07': 2000,
          },
        },
        expenses: [
          // 2026-06 expenses: 800
          { month: '2026-06', category: 'Rent', amount: 800 },
          // 2026-07 expenses: 1000
          { month: '2026-07', category: 'Rent', amount: 1000 },
          // 2026-08 expenses: 900
          { month: '2026-08', category: 'Rent', amount: 900 },
        ],
        savingEntries: [
          // 2026-06 savings: 200
          { month: '2026-06', type: 'deposit', amount: 200 },
          // 2026-07 savings: 300
          { month: '2026-07', type: 'deposit', amount: 300 },
        ],
        incomeEntries: [
          // 2026-06 extra income: 100
          { month: '2026-06', amount: 100 },
        ],
        loansTaken: [
          // 2026-07 loan: 400
          { month: '2026-07', amount: 400 },
        ],
      };

      const summary = computeMonthSummary(data);

      // June 2026 calculation:
      // income = 1800 + 100 = 1900
      // expenses = 800
      // savings = 200
      // remaining June = 1900 - 800 - 200 = 900

      // July 2026 calculation:
      // income = 2000 + 400 (loan) = 2400
      // expenses = 1000
      // savings = 300
      // remaining July = 2400 - 1000 - 300 = 1100

      // Past remaining roll-forward = 900 + 1100 = 2000
      expect(summary.previousMonthRemainingInCents).toBe(200000);
      expect(summary.previousMonthRemaining).toBe(2000);

      // August current income = 2000
      expect(summary.currentMonthIncomeInCents).toBe(200000);
      // August total income = 2000 + 2000 = 4000
      expect(summary.totalIncomeInCents).toBe(400000);

      // August expenses = 900, savings = 0
      // Remaining = 4000 - 900 - 0 = 3100
      expect(summary.remainingInCents).toBe(310000);
      expect(summary.remaining).toBe(3100);
    });

    it('produces negative remaining for deficit balances', () => {
      const data: RawFinancialData = {
        month: '2026-08',
        profile: {
          monthlySalary: 1000,
          createdAt: '2026-08-01T00:00:00.000Z',
        },
        expenses: [
          { month: '2026-08', category: 'Shopping', amount: 1500 },
        ],
        savingEntries: [],
        incomeEntries: [],
        loansTaken: [],
      };

      const summary = computeMonthSummary(data);

      expect(summary.remainingInCents).toBe(-50000);
      expect(summary.remaining).toBe(-500);
    });

    it('handles empty / undefined arrays safely', () => {
      const data: RawFinancialData = {
        month: '2026-08',
        profile: null,
        expenses: [],
        savingEntries: [],
        incomeEntries: [],
        loansTaken: [],
      };

      const summary = computeMonthSummary(data);

      expect(summary.totalIncomeInCents).toBe(0);
      expect(summary.totalExpensesInCents).toBe(0);
      expect(summary.totalSavingsInCents).toBe(0);
      expect(summary.remainingInCents).toBe(0);
      expect(summary.expenseCount).toBe(0);
    });
  });

  describe('computeCategoryBreakdown', () => {
    it('returns empty array when expenses are empty', () => {
      expect(computeCategoryBreakdown([], '2026-08')).toEqual([]);
    });

    it('returns 100% breakdown for a single category', () => {
      const expenses = [
        { month: '2026-08', category: 'Food', amount: 150.5 },
      ];

      const breakdown = computeCategoryBreakdown(expenses, '2026-08');

      expect(breakdown).toHaveLength(1);
      expect(breakdown[0]).toEqual({
        category: 'Food',
        totalInCents: 15050,
        total: 150.5,
        count: 1,
        percentage: 100,
      });
    });

    it('aggregates multiple categories and sorts descending by total amount', () => {
      const expenses = [
        { month: '2026-08', category: 'Food', amount: 200 },
        { month: '2026-08', category: 'Food', amount: 100 },
        { month: '2026-08', category: 'Housing', amount: 600 },
        { month: '2026-08', category: 'Transport', amount: 100 },
        { month: '2026-07', category: 'Food', amount: 999 }, // Other month
      ];

      const breakdown = computeCategoryBreakdown(expenses, '2026-08');

      expect(breakdown).toHaveLength(3);
      // Total = 600 + 300 + 100 = 1000
      expect(breakdown[0]).toEqual({
        category: 'Housing',
        totalInCents: 60000,
        total: 600,
        count: 1,
        percentage: 60,
      });
      expect(breakdown[1]).toEqual({
        category: 'Food',
        totalInCents: 30000,
        total: 300,
        count: 2,
        percentage: 30,
      });
      expect(breakdown[2]).toEqual({
        category: 'Transport',
        totalInCents: 10000,
        total: 100,
        count: 1,
        percentage: 10,
      });
    });
  });

  describe('computeMonthlyTrend', () => {
    it('aggregates expenses and net savings across specified months', () => {
      const expenses = [
        { month: '2026-01', category: 'Food', amount: 500 },
        { month: '2026-02', category: 'Food', amount: 600 },
        { month: '2026-02', category: 'Rent', amount: 400 },
      ];
      const savings = [
        { month: '2026-01', type: 'deposit' as const, amount: 200 },
        { month: '2026-02', type: 'deposit' as const, amount: 500 },
        { month: '2026-02', type: 'withdrawal' as const, amount: 100 },
      ];

      const months = ['2026-01', '2026-02', '2026-03'];
      const trend = computeMonthlyTrend(expenses, savings, months);

      expect(trend).toEqual([
        {
          month: '2026-01',
          totalExpensesInCents: 50000,
          totalExpenses: 500,
          totalSavingsInCents: 20000,
          totalSavings: 200,
        },
        {
          month: '2026-02',
          totalExpensesInCents: 100000,
          totalExpenses: 1000,
          totalSavingsInCents: 40000,
          totalSavings: 400,
        },
        {
          month: '2026-03',
          totalExpensesInCents: 0,
          totalExpenses: 0,
          totalSavingsInCents: 0,
          totalSavings: 0,
        },
      ]);
    });
  });

  describe('getPastMonthKeys', () => {
    it('returns 6 past months in chronological order for a given reference date', () => {
      const keys = getPastMonthKeys(6, new Date(2026, 7, 15)); // August 2026
      expect(keys).toEqual([
        '2026-03',
        '2026-04',
        '2026-05',
        '2026-06',
        '2026-07',
        '2026-08',
      ]);
    });

    it('handles reference date as YYYY-MM string', () => {
      const keys = getPastMonthKeys(3, '2026-02');
      expect(keys).toEqual(['2025-12', '2026-01', '2026-02']);
    });
  });
});
