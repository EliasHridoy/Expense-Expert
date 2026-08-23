import { Expense } from '../../expenses/types/expense.types';
import {
  toCents,
  fromCents,
  subtractCents,
  addCents,
} from '../../expenses/utils/currency.util';
import {
  CategoryBudget,
  BudgetUsage,
  BudgetSummary,
  ThresholdState,
  ThresholdColorStyles,
} from '../types/budget.types';

/**
 * Calculates budget usage metrics for a category budget against matching expenses.
 * Uses integer cents to eliminate floating-point drift.
 */
export function calculateBudgetUsage(
  budget: CategoryBudget,
  matchingExpenses: Expense[] = []
): BudgetUsage {
  const limitInCents = Number.isFinite(budget.limitInCents)
    ? Math.round(budget.limitInCents)
    : toCents(budget.limit);

  const spentInCents = matchingExpenses
    .filter((e) => e.category === budget.category && e.month === budget.month)
    .reduce((sum, e) => {
      const expenseCents = Number.isFinite(e.amountInCents)
        ? Math.round(e.amountInCents)
        : toCents(e.amount);
      return addCents(sum, expenseCents);
    }, 0);

  const remainingInCents = subtractCents(limitInCents, spentInCents);

  const rawPercentage = limitInCents > 0
    ? (spentInCents / limitInCents) * 100
    : spentInCents > 0
    ? 100
    : 0;

  // Threshold state calculation using integer math
  const isExceeded = limitInCents > 0
    ? spentInCents >= limitInCents
    : spentInCents > 0;

  const isNearLimit = !isExceeded && limitInCents > 0 && spentInCents * 100 >= limitInCents * 80;

  let thresholdState: ThresholdState = 'under';
  if (isExceeded) {
    thresholdState = 'exceeded';
  } else if (isNearLimit) {
    thresholdState = 'warning';
  }

  return {
    budgetId: budget.id,
    category: budget.category,
    month: budget.month,
    limitInCents,
    limit: fromCents(limitInCents),
    spentInCents,
    spent: fromCents(spentInCents),
    remainingInCents,
    remaining: fromCents(remainingInCents),
    percentage: Math.round(rawPercentage * 10) / 10,
    thresholdState,
    isExceeded,
    isNearLimit,
  };
}

/**
 * Aggregates all category budgets in a given month and computes total spending summary.
 */
export function calculateTotalBudgetSummary(
  budgets: CategoryBudget[] = [],
  expenses: Expense[] = [],
  month: string
): BudgetSummary {
  const monthBudgets = budgets.filter((b) => b.month === month);
  const budgetedCategories = new Set(monthBudgets.map((b) => b.category));

  const totalLimitInCents = monthBudgets.reduce((sum, b) => {
    const limitCents = Number.isFinite(b.limitInCents)
      ? Math.round(b.limitInCents)
      : toCents(b.limit);
    return addCents(sum, limitCents);
  }, 0);

  const totalSpentInCents = expenses
    .filter((e) => e.month === month && budgetedCategories.has(e.category))
    .reduce((sum, e) => {
      const expenseCents = Number.isFinite(e.amountInCents)
        ? Math.round(e.amountInCents)
        : toCents(e.amount);
      return addCents(sum, expenseCents);
    }, 0);

  const totalRemainingInCents = subtractCents(totalLimitInCents, totalSpentInCents);

  const rawPercentage = totalLimitInCents > 0
    ? (totalSpentInCents / totalLimitInCents) * 100
    : totalSpentInCents > 0
    ? 100
    : 0;

  let thresholdState: ThresholdState = 'under';
  if (totalLimitInCents > 0) {
    if (totalSpentInCents >= totalLimitInCents) {
      thresholdState = 'exceeded';
    } else if (totalSpentInCents * 100 >= totalLimitInCents * 80) {
      thresholdState = 'warning';
    }
  } else if (totalSpentInCents > 0) {
    thresholdState = 'exceeded';
  }

  return {
    totalLimitInCents,
    totalLimit: fromCents(totalLimitInCents),
    totalSpentInCents,
    totalSpent: fromCents(totalSpentInCents),
    totalRemainingInCents,
    totalRemaining: fromCents(totalRemainingInCents),
    percentage: Math.round(rawPercentage * 10) / 10,
    thresholdState,
  };
}

/**
 * Returns Tailwind class mappings for visual budget thresholds.
 */
export function getThresholdColor(state: ThresholdState): ThresholdColorStyles {
  switch (state) {
    case 'warning':
      return {
        barColor: 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
        badgeText: 'text-amber-700 dark:text-amber-300',
      };
    case 'exceeded':
      return {
        barColor: 'bg-rose-500',
        textColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
        badgeText: 'text-rose-700 dark:text-rose-300',
      };
    case 'under':
    default:
      return {
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
      };
  }
}
