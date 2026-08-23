import {
  calculateBudgetUsage,
  calculateTotalBudgetSummary,
  getThresholdColor,
} from '../../../src/features/budgets/utils/budget.util';
import { CategoryBudget } from '../../../src/features/budgets/types/budget.types';
import { Expense } from '../../../src/features/expenses/types/expense.types';

describe('budget.util', () => {
  const mockBudget: CategoryBudget = {
    id: '2026-08_food',
    userId: 'user_123',
    category: 'food',
    month: '2026-08',
    limit: 500,
    limitInCents: 50000,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  const createExpense = (
    category: string,
    amountInCents: number,
    month = '2026-08'
  ): Expense => ({
    id: `exp_${Math.random()}`,
    title: 'Test Expense',
    description: '',
    amount: amountInCents / 100,
    amountInCents,
    category,
    date: `${month}-05T12:00:00.000Z`,
    month,
    isLoan: false,
    loanPersonId: null,
    loanCleared: false,
    loanRepaid: 0,
    loanTakenId: null,
    draftId: null,
    installmentIndex: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  });

  describe('calculateBudgetUsage', () => {
    it('calculates usage correctly when under budget (< 80%)', () => {
      const expenses = [
        createExpense('food', 15000), // $150
        createExpense('food', 10000), // $100 -> Total $250 / $500 = 50%
      ];

      const usage = calculateBudgetUsage(mockBudget, expenses);

      expect(usage.limitInCents).toBe(50000);
      expect(usage.limit).toBe(500);
      expect(usage.spentInCents).toBe(25000);
      expect(usage.spent).toBe(250);
      expect(usage.remainingInCents).toBe(25000);
      expect(usage.remaining).toBe(250);
      expect(usage.percentage).toBe(50);
      expect(usage.thresholdState).toBe('under');
      expect(usage.isExceeded).toBe(false);
      expect(usage.isNearLimit).toBe(false);
    });

    it('identifies exact boundary condition at 80% spending as warning', () => {
      const expenses = [
        createExpense('food', 40000), // $400 of $500 = exactly 80%
      ];

      const usage = calculateBudgetUsage(mockBudget, expenses);

      expect(usage.spentInCents).toBe(40000);
      expect(usage.remainingInCents).toBe(10000);
      expect(usage.percentage).toBe(80);
      expect(usage.thresholdState).toBe('warning');
      expect(usage.isExceeded).toBe(false);
      expect(usage.isNearLimit).toBe(true);
    });

    it('identifies 80% - 99.9% spending as warning', () => {
      const expenses = [
        createExpense('food', 47550), // $475.50 of $500 = 95.1%
      ];

      const usage = calculateBudgetUsage(mockBudget, expenses);

      expect(usage.spentInCents).toBe(47550);
      expect(usage.remainingInCents).toBe(2450);
      expect(usage.percentage).toBe(95.1);
      expect(usage.thresholdState).toBe('warning');
      expect(usage.isExceeded).toBe(false);
      expect(usage.isNearLimit).toBe(true);
    });

    it('identifies exact boundary condition at 100% spending as exceeded', () => {
      const expenses = [
        createExpense('food', 50000), // $500 of $500 = 100%
      ];

      const usage = calculateBudgetUsage(mockBudget, expenses);

      expect(usage.spentInCents).toBe(50000);
      expect(usage.remainingInCents).toBe(0);
      expect(usage.remaining).toBe(0);
      expect(usage.percentage).toBe(100);
      expect(usage.thresholdState).toBe('exceeded');
      expect(usage.isExceeded).toBe(true);
      expect(usage.isNearLimit).toBe(false);
    });

    it('handles exceeded budget (> 100%) with negative remaining balance', () => {
      const expenses = [
        createExpense('food', 62500), // $625 of $500 = 125%
      ];

      const usage = calculateBudgetUsage(mockBudget, expenses);

      expect(usage.spentInCents).toBe(62500);
      expect(usage.remainingInCents).toBe(-12500);
      expect(usage.remaining).toBe(-125);
      expect(usage.percentage).toBe(125);
      expect(usage.thresholdState).toBe('exceeded');
      expect(usage.isExceeded).toBe(true);
      expect(usage.isNearLimit).toBe(false);
    });

    it('ignores expenses from different months or categories', () => {
      const expenses = [
        createExpense('food', 20000, '2026-08'), // Match
        createExpense('transport', 10000, '2026-08'), // Different category
        createExpense('food', 30000, '2026-07'), // Different month
      ];

      const usage = calculateBudgetUsage(mockBudget, expenses);

      expect(usage.spentInCents).toBe(20000);
      expect(usage.remainingInCents).toBe(30000);
      expect(usage.percentage).toBe(40);
    });

    it('handles zero budget limit gracefully', () => {
      const zeroBudget: CategoryBudget = {
        ...mockBudget,
        limit: 0,
        limitInCents: 0,
      };

      const usageWithZeroExpenses = calculateBudgetUsage(zeroBudget, []);
      expect(usageWithZeroExpenses.percentage).toBe(0);
      expect(usageWithZeroExpenses.thresholdState).toBe('under');

      const usageWithExpenses = calculateBudgetUsage(zeroBudget, [createExpense('food', 1000)]);
      expect(usageWithExpenses.percentage).toBe(100);
      expect(usageWithExpenses.thresholdState).toBe('exceeded');
      expect(usageWithExpenses.isExceeded).toBe(true);
    });

    it('falls back to toCents if limitInCents is not finite', () => {
      const budgetWithoutCents: CategoryBudget = {
        ...mockBudget,
        limit: 120.5,
        limitInCents: undefined as any,
      };

      const usage = calculateBudgetUsage(budgetWithoutCents, [createExpense('food', 6025)]);
      expect(usage.limitInCents).toBe(12050);
      expect(usage.spentInCents).toBe(6025);
      expect(usage.percentage).toBe(50);
    });
  });

  describe('calculateTotalBudgetSummary', () => {
    it('aggregates multiple category budgets and spending in month', () => {
      const budgets: CategoryBudget[] = [
        {
          id: '2026-08_food',
          userId: 'u1',
          category: 'food',
          month: '2026-08',
          limit: 400,
          limitInCents: 40000,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: '2026-08_transport',
          userId: 'u1',
          category: 'transport',
          month: '2026-08',
          limit: 200,
          limitInCents: 20000,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: '2026-07_food',
          userId: 'u1',
          category: 'food',
          month: '2026-07',
          limit: 500,
          limitInCents: 50000,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const expenses: Expense[] = [
        createExpense('food', 30000, '2026-08'), // $300
        createExpense('transport', 10000, '2026-08'), // $100 -> Total $400 / $600 = 66.7%
        createExpense('other', 5000, '2026-08'), // Not in budgeted categories
        createExpense('food', 10000, '2026-07'), // Different month
      ];

      const summary = calculateTotalBudgetSummary(budgets, expenses, '2026-08');

      expect(summary.totalLimitInCents).toBe(60000);
      expect(summary.totalLimit).toBe(600);
      expect(summary.totalSpentInCents).toBe(40000);
      expect(summary.totalSpent).toBe(400);
      expect(summary.totalRemainingInCents).toBe(20000);
      expect(summary.totalRemaining).toBe(200);
      expect(summary.percentage).toBe(66.7);
      expect(summary.thresholdState).toBe('under');
    });

    it('computes warning state for total summary when spending is >= 80%', () => {
      const budgets: CategoryBudget[] = [
        {
          id: '2026-08_food',
          userId: 'u1',
          category: 'food',
          month: '2026-08',
          limit: 100,
          limitInCents: 10000,
          createdAt: '',
          updatedAt: '',
        },
      ];
      const expenses = [createExpense('food', 8500, '2026-08')]; // 85%

      const summary = calculateTotalBudgetSummary(budgets, expenses, '2026-08');

      expect(summary.percentage).toBe(85);
      expect(summary.thresholdState).toBe('warning');
    });

    it('computes exceeded state for total summary when spending is >= 100%', () => {
      const budgets: CategoryBudget[] = [
        {
          id: '2026-08_food',
          userId: 'u1',
          category: 'food',
          month: '2026-08',
          limit: 100,
          limitInCents: 10000,
          createdAt: '',
          updatedAt: '',
        },
      ];
      const expenses = [createExpense('food', 11000, '2026-08')]; // 110%

      const summary = calculateTotalBudgetSummary(budgets, expenses, '2026-08');

      expect(summary.percentage).toBe(110);
      expect(summary.thresholdState).toBe('exceeded');
      expect(summary.totalRemainingInCents).toBe(-1000);
    });

    it('handles empty budgets and empty expenses', () => {
      const summary = calculateTotalBudgetSummary([], [], '2026-08');
      expect(summary.totalLimitInCents).toBe(0);
      expect(summary.totalSpentInCents).toBe(0);
      expect(summary.totalRemainingInCents).toBe(0);
      expect(summary.percentage).toBe(0);
      expect(summary.thresholdState).toBe('under');
    });
  });

  describe('getThresholdColor', () => {
    it('returns emerald color tokens for under state', () => {
      const colors = getThresholdColor('under');
      expect(colors.barColor).toBe('bg-emerald-500');
      expect(colors.textColor).toContain('text-emerald');
      expect(colors.badgeBg).toContain('bg-emerald');
    });

    it('returns amber color tokens for warning state', () => {
      const colors = getThresholdColor('warning');
      expect(colors.barColor).toBe('bg-amber-500');
      expect(colors.textColor).toContain('text-amber');
      expect(colors.badgeBg).toContain('bg-amber');
    });

    it('returns rose color tokens for exceeded state', () => {
      const colors = getThresholdColor('exceeded');
      expect(colors.barColor).toBe('bg-rose-500');
      expect(colors.textColor).toContain('text-rose');
      expect(colors.badgeBg).toContain('bg-rose');
    });
  });
});
