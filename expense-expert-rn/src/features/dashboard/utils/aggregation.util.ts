/**
 * Financial Aggregation Engine
 *
 * Provides pure, zero-drift financial calculations operating exclusively on integer cents.
 * Handles historical salary resolution, cumulative balance carryover, savings deduplication,
 * category breakdowns, and monthly trend aggregations.
 */

import {
  toCents,
  fromCents,
  addCents,
  subtractCents,
} from '../../expenses/utils/currency.util';
import {
  MonthSummary,
  MonthlyTrend,
  CategoryBreakdown,
  RawFinancialData,
  UserProfileFinancials,
} from '../types/dashboard.types';

/**
 * Resolves salary in integer cents for a specific month based on salary history map.
 * Checks for exact month match, then finds closest preceding historical step, or falls back to monthlySalary.
 */
export function resolveSalaryInCents(
  profile: UserProfileFinancials | null | undefined,
  targetMonth: string
): number {
  if (!profile) return 0;
  if (profile.salaries && profile.salaries[targetMonth] !== undefined) {
    return toCents(profile.salaries[targetMonth]);
  }
  if (profile.salaries) {
    const pastMonths = Object.keys(profile.salaries).sort();
    if (pastMonths.length > 0) {
      const monthsBefore = pastMonths.filter((m) => m < targetMonth);
      if (monthsBefore.length > 0) {
        const closestMonth = monthsBefore[monthsBefore.length - 1];
        return toCents(profile.salaries[closestMonth]);
      }
      return toCents(profile.salaries[pastMonths[0]]);
    }
  }
  return toCents(profile.monthlySalary ?? 0);
}

/**
 * Computes all months between startDate and endMonthStr (exclusive of endMonthStr).
 * Output format: ['YYYY-MM', ...] in chronological order.
 */
export function getMonthsBetween(
  startDate: Date | string,
  endMonthStr: string
): string[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  if (!start || isNaN(start.getTime())) return [];

  const months: string[] = [];
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();

  const [endYearStr, endMonthNumStr] = endMonthStr.split('-');
  const endYear = parseInt(endYearStr, 10);
  const endMonth = parseInt(endMonthNumStr, 10) - 1;

  if (isNaN(endYear) || isNaN(endMonth)) return [];

  let currentYear = startYear;
  let currentMonth = startMonth;

  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth < endMonth)
  ) {
    months.push(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return months;
}

/**
 * Computes the complete MonthSummary using zero-drift integer cents arithmetic.
 */
export function computeMonthSummary(data: RawFinancialData): MonthSummary {
  const { month, profile, expenses = [], savingEntries = [], incomeEntries = [], loansTaken = [] } = data;

  // 1. Current month transactions
  const curExpenses = expenses.filter((e) => e.month === month);
  const curSavings = savingEntries.filter((s) => s.month === month);
  const curIncome = incomeEntries.filter((i) => i.month === month);
  const curLoans = loansTaken.filter((l) => l.month === month);

  // 2. Current month aggregations in cents
  const totalExpensesInCents = curExpenses.reduce(
    (sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)),
    0
  );

  const totalSavingsInCents = curSavings.reduce((sum, s) => {
    const val = s.amountInCents ?? toCents(s.amount);
    return s.type === 'deposit' ? addCents(sum, val) : subtractCents(sum, val);
  }, 0);

  // Expenses categorized as "savings" (case-insensitive check)
  const savingsInExpensesInCents = curExpenses
    .filter((e) => e.category?.toLowerCase() === 'savings')
    .reduce(
      (sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)),
      0
    );

  const salaryInCents = resolveSalaryInCents(profile, month);
  const additionalIncomeInCents = curIncome.reduce(
    (sum, i) => addCents(sum, i.amountInCents ?? toCents(i.amount)),
    0
  );
  const loansTakenIncomeInCents = curLoans.reduce(
    (sum, l) => addCents(sum, l.amountInCents ?? toCents(l.amount)),
    0
  );

  const currentMonthIncomeInCents = addCents(
    addCents(salaryInCents, additionalIncomeInCents),
    loansTakenIncomeInCents
  );

  // 3. Historical carryover calculation (previousMonthRemaining)
  let previousMonthRemainingInCents = 0;
  if (profile?.createdAt) {
    const pastMonths = getMonthsBetween(profile.createdAt, month);

    for (const pastMonth of pastMonths) {
      const pExpenses = expenses.filter((e) => e.month === pastMonth);
      const pSavings = savingEntries.filter((s) => s.month === pastMonth);
      const pIncome = incomeEntries.filter((i) => i.month === pastMonth);
      const pLoans = loansTaken.filter((l) => l.month === pastMonth);

      const pTotalExpenses = pExpenses.reduce(
        (sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)),
        0
      );
      const pTotalSavings = pSavings.reduce((sum, s) => {
        const val = s.amountInCents ?? toCents(s.amount);
        return s.type === 'deposit' ? addCents(sum, val) : subtractCents(sum, val);
      }, 0);
      const pSavingsInExpenses = pExpenses
        .filter((e) => e.category?.toLowerCase() === 'savings')
        .reduce(
          (sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)),
          0
        );

      const pSalary = resolveSalaryInCents(profile, pastMonth);
      const pAdditional = pIncome.reduce(
        (sum, i) => addCents(sum, i.amountInCents ?? toCents(i.amount)),
        0
      );
      const pLoansIncome = pLoans.reduce(
        (sum, l) => addCents(sum, l.amountInCents ?? toCents(l.amount)),
        0
      );

      const pTotalIncome = addCents(addCents(pSalary, pAdditional), pLoansIncome);
      const pNetSavingsDeduction = subtractCents(pTotalSavings, pSavingsInExpenses);
      const pNetRemaining = subtractCents(
        subtractCents(pTotalIncome, pTotalExpenses),
        pNetSavingsDeduction
      );

      previousMonthRemainingInCents = addCents(
        previousMonthRemainingInCents,
        pNetRemaining
      );
    }
  }

  // 4. Final totals
  const totalIncomeInCents = addCents(
    currentMonthIncomeInCents,
    previousMonthRemainingInCents
  );
  const netSavingsDeductionInCents = subtractCents(
    totalSavingsInCents,
    savingsInExpensesInCents
  );
  const remainingInCents = subtractCents(
    subtractCents(totalIncomeInCents, totalExpensesInCents),
    netSavingsDeductionInCents
  );

  return {
    month,
    totalIncomeInCents,
    totalIncome: fromCents(totalIncomeInCents),
    currentMonthIncomeInCents,
    currentMonthIncome: fromCents(currentMonthIncomeInCents),
    previousMonthRemainingInCents,
    previousMonthRemaining: fromCents(previousMonthRemainingInCents),
    totalExpensesInCents,
    totalExpenses: fromCents(totalExpensesInCents),
    totalSavingsInCents,
    totalSavings: fromCents(totalSavingsInCents),
    remainingInCents,
    remaining: fromCents(remainingInCents),
    loansTakenIncomeInCents,
    loansTakenIncome: fromCents(loansTakenIncomeInCents),
    expenseCount: curExpenses.length,
  };
}

/**
 * Computes category breakdown for a specific month, sorted descending by total amount.
 */
export function computeCategoryBreakdown(
  expenses: RawFinancialData['expenses'] = [],
  month: string
): CategoryBreakdown[] {
  const monthExpenses = expenses.filter((e) => e.month === month);
  const categoryMap = new Map<string, { totalInCents: number; count: number }>();
  let grandTotalInCents = 0;

  for (const expense of monthExpenses) {
    const amountInCents = expense.amountInCents ?? toCents(expense.amount);
    const category = expense.category || 'General';
    grandTotalInCents = addCents(grandTotalInCents, amountInCents);

    const existing = categoryMap.get(category) || { totalInCents: 0, count: 0 };
    existing.totalInCents = addCents(existing.totalInCents, amountInCents);
    existing.count += 1;
    categoryMap.set(category, existing);
  }

  return Array.from(categoryMap.entries())
    .map(([category, data]) => {
      const percentage =
        grandTotalInCents > 0
          ? Math.round((data.totalInCents / grandTotalInCents) * 1000) / 10
          : 0;

      return {
        category,
        totalInCents: data.totalInCents,
        total: fromCents(data.totalInCents),
        count: data.count,
        percentage,
      };
    })
    .sort((a, b) => b.totalInCents - a.totalInCents);
}

/**
 * Computes monthly trends across the specified month keys.
 */
export function computeMonthlyTrend(
  expenses: RawFinancialData['expenses'] = [],
  savingEntries: RawFinancialData['savingEntries'] = [],
  months: string[] = []
): MonthlyTrend[] {
  return months.map((monthKey) => {
    const monthExpenses = expenses.filter((e) => e.month === monthKey);
    const monthSavings = savingEntries.filter((s) => s.month === monthKey);

    const totalExpensesInCents = monthExpenses.reduce(
      (sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)),
      0
    );

    const totalSavingsInCents = monthSavings.reduce((sum, s) => {
      const val = s.amountInCents ?? toCents(s.amount);
      return s.type === 'deposit' ? addCents(sum, val) : subtractCents(sum, val);
    }, 0);

    return {
      month: monthKey,
      totalExpensesInCents,
      totalExpenses: fromCents(totalExpensesInCents),
      totalSavingsInCents,
      totalSavings: fromCents(totalSavingsInCents),
    };
  });
}

/**
 * Generates an array of YYYY-MM keys for the past `count` months in chronological order.
 */
export function getPastMonthKeys(
  count: number = 6,
  referenceDate: Date | string = new Date()
): string[] {
  let baseDate: Date;
  if (typeof referenceDate === 'string') {
    if (/^\d{4}-\d{2}$/.test(referenceDate)) {
      const [y, m] = referenceDate.split('-').map(Number);
      baseDate = new Date(y, m - 1, 1);
    } else {
      baseDate = new Date(referenceDate);
    }
  } else {
    baseDate = referenceDate;
  }

  if (!baseDate || isNaN(baseDate.getTime())) {
    baseDate = new Date();
  }

  const months: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  return months.reverse();
}
