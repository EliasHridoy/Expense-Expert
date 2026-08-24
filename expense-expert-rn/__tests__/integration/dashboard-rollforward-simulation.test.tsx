import React from 'react';
import { render, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import { format } from 'date-fns';

// Utilities and Models
import {
  toCents,
  fromCents,
  addCents,
  subtractCents,
} from '../../src/features/expenses/utils/currency.util';
import {
  computeMonthSummary,
  computeCategoryBreakdown,
  computeMonthlyTrend,
  resolveSalaryInCents,
  getMonthsBetween,
  getPastMonthKeys,
} from '../../src/features/dashboard/utils/aggregation.util';
import {
  RawFinancialData,
  CategoryBreakdown,
  MonthlyTrend,
  UserProfileFinancials,
} from '../../src/features/dashboard/types/dashboard.types';

// Components
import { CategoryDonutChart } from '../../src/features/dashboard/components/CategoryDonutChart';
import { MonthlyTrendBarChart } from '../../src/features/dashboard/components/MonthlyTrendBarChart';
import { MonthNavigator } from '../../src/features/dashboard/components/MonthNavigator';

// Contexts & Screens
import AppDashboardScreen from '../../app/(app)/index';
import { DashboardProvider } from '../../src/features/dashboard/context/DashboardProvider';
import { CategoryContext } from '../../src/features/categories/context/CategoryContext';
import { BudgetContext } from '../../src/features/budgets/context/BudgetContext';
import { DashboardService } from '../../src/features/dashboard/services/dashboard.service';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useExpenses } from '../../src/features/expenses/hooks/useExpenses';

// Mocks
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/features/expenses/hooks/useExpenses', () => ({
  useExpenses: jest.fn(),
}));

jest.mock('../../src/features/dashboard/services/dashboard.service', () => ({
  DashboardService: {
    getMonthSummary: jest.fn(),
    getMonthlyTrend: jest.fn(),
    getCategoryBreakdown: jest.fn(),
    fetchRawFinancialData: jest.fn(),
    clearDashboardCache: jest.fn(),
  },
  DASHBOARD_SUMMARY_CACHE_PREFIX: '@expense_expert_dashboard_summary_',
  DASHBOARD_TREND_CACHE_PREFIX: '@expense_expert_dashboard_trend_',
  DASHBOARD_BREAKDOWN_CACHE_PREFIX: '@expense_expert_dashboard_breakdown_',
}));

/**
 * Reference Oracle: Exact Angular TypeScript implementation of the financial calculation
 * from `expense-expert/src/app/core/services/dashboard.service.ts`
 */
function angularDashboardCalculationOracle(
  allExpenses: Array<{ amount: number; category: string; month: string }>,
  allSavingEntries: Array<{ amount: number; type: 'deposit' | 'withdrawal'; month: string }>,
  allIncomeEntries: Array<{ amount: number; month: string }>,
  allLoansTaken: Array<{ amount: number; month: string }>,
  profile: {
    createdAt?: Date | string;
    monthlySalary?: number;
    salaries?: Record<string, number>;
  } | null,
  month: string
) {
  // Angular helper: getSalaryForMonth
  const getSalaryForMonth = (prof: typeof profile, targetMonth: string): number => {
    if (!prof) return 0;
    if (prof.salaries && prof.salaries[targetMonth] !== undefined) {
      return prof.salaries[targetMonth];
    }
    if (prof.salaries) {
      const pastMonths = Object.keys(prof.salaries).sort();
      if (pastMonths.length > 0) {
        const monthsBefore = pastMonths.filter((m) => m < targetMonth);
        if (monthsBefore.length > 0) {
          const closestMonth = monthsBefore[monthsBefore.length - 1];
          return prof.salaries[closestMonth];
        }
        return prof.salaries[pastMonths[0]];
      }
    }
    return prof.monthlySalary ?? 0;
  };

  // Angular helper: getMonthsBetween
  const getMonthsBetweenAngular = (startDate: Date, endMonthStr: string): string[] => {
    const months: string[] = [];
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();

    const [endYearStr, endMonthNumStr] = endMonthStr.split('-');
    const endYear = parseInt(endYearStr, 10);
    const endMonth = parseInt(endMonthNumStr, 10) - 1;

    let currentYear = startYear;
    let currentMonth = startMonth;

    while (currentYear < endYear || (currentYear === endYear && currentMonth < endMonth)) {
      months.push(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    return months;
  };

  const expenses = allExpenses.filter((e) => e.month === month);
  const savingEntries = allSavingEntries.filter((e) => e.month === month);
  const incomeEntries = allIncomeEntries.filter((e) => e.month === month);
  const loansTakenThisMonth = allLoansTaken.filter((l) => l.month === month);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSavings = savingEntries.reduce(
    (sum, e) => sum + (e.type === 'deposit' ? e.amount : -e.amount),
    0
  );
  const savingsInExpenses = expenses
    .filter((e) => e.category.toLowerCase() === 'savings')
    .reduce((sum, e) => sum + e.amount, 0);

  const salary = getSalaryForMonth(profile, month);
  const additionalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);
  const loansTakenIncome = loansTakenThisMonth.reduce((sum, l) => sum + l.amount, 0);
  const currentMonthIncome = salary + additionalIncome + loansTakenIncome;

  let previousMonthRemaining = 0;
  const rawCreatedAt = profile?.createdAt;
  if (rawCreatedAt) {
    const createdAtDate = typeof rawCreatedAt === 'string' ? new Date(rawCreatedAt) : rawCreatedAt;
    const pastMonths = getMonthsBetweenAngular(createdAtDate, month);
    for (const pastMonth of pastMonths) {
      const pastExpenses = allExpenses.filter((e) => e.month === pastMonth);
      const pastSavings = allSavingEntries.filter((e) => e.month === pastMonth);
      const pastIncome = allIncomeEntries.filter((e) => e.month === pastMonth);
      const pastLoansTaken = allLoansTaken.filter((l) => l.month === pastMonth);

      const pastTotalExpenses = pastExpenses.reduce((sum, e) => sum + e.amount, 0);
      const pastTotalSavings = pastSavings.reduce(
        (sum, e) => sum + (e.type === 'deposit' ? e.amount : -e.amount),
        0
      );
      const pastSavingsInExpenses = pastExpenses
        .filter((e) => e.category.toLowerCase() === 'savings')
        .reduce((sum, e) => sum + e.amount, 0);
      const pastAdditionalIncome = pastIncome.reduce((sum, e) => sum + e.amount, 0);
      const pastSalary = getSalaryForMonth(profile, pastMonth);
      const pastLoansTakenIncome = pastLoansTaken.reduce((sum, l) => sum + l.amount, 0);
      const pastTotalIncome = pastSalary + pastAdditionalIncome + pastLoansTakenIncome;

      previousMonthRemaining +=
        pastTotalIncome - pastTotalExpenses - (pastTotalSavings - pastSavingsInExpenses);
    }
  }

  const totalIncome = currentMonthIncome + previousMonthRemaining;
  const remaining = totalIncome - totalExpenses - (totalSavings - savingsInExpenses);

  return {
    previousMonthRemaining,
    currentMonthIncome,
    totalIncome,
    totalExpenses,
    totalSavings,
    remaining,
    expenseCount: expenses.length,
    loansTakenIncome,
  };
}

describe('Dashboard & Financial Roll-forward Module - Simulation Test Suite', () => {
  // --------------------------------------------------------------------------
  // Rich 12-Month Simulation Dataset (2025-09 through 2026-08)
  // --------------------------------------------------------------------------
  const simulationProfile: UserProfileFinancials = {
    monthlySalary: 5000,
    salaries: {
      '2025-09': 4000, // Starting salary
      '2026-01': 4500, // Mid-year promotion
      '2026-06': 5200, // Senior raise
    },
    createdAt: '2025-09-01T00:00:00.000Z',
  };

  const simulationExpenses = [
    // 2025-09
    { id: 'e-01', amount: 1200, amountInCents: 120000, category: 'Housing', month: '2025-09' },
    { id: 'e-02', amount: 450.5, amountInCents: 45050, category: 'Food', month: '2025-09' },
    { id: 'e-03', amount: 150, amountInCents: 15000, category: 'Transport', month: '2025-09' },
    // 2025-10
    { id: 'e-04', amount: 1200, amountInCents: 120000, category: 'Housing', month: '2025-10' },
    { id: 'e-05', amount: 500, amountInCents: 50000, category: 'Food', month: '2025-10' },
    { id: 'e-06', amount: 200, amountInCents: 20000, category: 'Savings', month: '2025-10' }, // Savings category expense
    // 2025-11
    { id: 'e-07', amount: 1200, amountInCents: 120000, category: 'Housing', month: '2025-11' },
    { id: 'e-08', amount: 350, amountInCents: 35000, category: 'Utilities', month: '2025-11' },
    // 2025-12
    { id: 'e-09', amount: 1200, amountInCents: 120000, category: 'Housing', month: '2025-12' },
    { id: 'e-10', amount: 800, amountInCents: 80000, category: 'Entertainment', month: '2025-12' },
    // 2026-01 (Salary stepped up to 4500)
    { id: 'e-11', amount: 1300, amountInCents: 130000, category: 'Housing', month: '2026-01' },
    { id: 'e-12', amount: 600, amountInCents: 60000, category: 'Food', month: '2026-01' },
    // 2026-02
    { id: 'e-13', amount: 1300, amountInCents: 130000, category: 'Housing', month: '2026-02' },
    { id: 'e-14', amount: 400, amountInCents: 40000, category: 'Transport', month: '2026-02' },
    // 2026-03
    { id: 'e-15', amount: 1300, amountInCents: 130000, category: 'Housing', month: '2026-03' },
    { id: 'e-16', amount: 550, amountInCents: 55000, category: 'Food', month: '2026-03' },
    // 2026-04
    { id: 'e-17', amount: 1300, amountInCents: 130000, category: 'Housing', month: '2026-04' },
    { id: 'e-18', amount: 300, amountInCents: 30000, category: 'Utilities', month: '2026-04' },
    // 2026-05
    { id: 'e-19', amount: 1300, amountInCents: 130000, category: 'Housing', month: '2026-05' },
    { id: 'e-20', amount: 450, amountInCents: 45000, category: 'Food', month: '2026-05' },
    // 2026-06 (Salary stepped up to 5200)
    { id: 'e-21', amount: 1400, amountInCents: 140000, category: 'Housing', month: '2026-06' },
    { id: 'e-22', amount: 500, amountInCents: 50000, category: 'Food', month: '2026-06' },
    // 2026-07
    { id: 'e-23', amount: 1400, amountInCents: 140000, category: 'Housing', month: '2026-07' },
    { id: 'e-24', amount: 350, amountInCents: 35000, category: 'Entertainment', month: '2026-07' },
    // 2026-08 (Target current active month)
    { id: 'e-25', amount: 1400, amountInCents: 140000, category: 'Housing', month: '2026-08' },
    { id: 'e-26', amount: 650.75, amountInCents: 65075, category: 'Food', month: '2026-08' },
    { id: 'e-27', amount: 250.25, amountInCents: 25025, category: 'Transport', month: '2026-08' },
    { id: 'e-28', amount: 300, amountInCents: 30000, category: 'Savings', month: '2026-08' }, // Savings category expense
    { id: 'e-29', amount: 200, amountInCents: 20000, category: 'Utilities', month: '2026-08' },
  ];

  const simulationSavings = [
    { id: 's-01', amount: 500, amountInCents: 50000, type: 'deposit' as const, month: '2025-09' },
    { id: 's-02', amount: 600, amountInCents: 60000, type: 'deposit' as const, month: '2025-10' },
    { id: 's-03', amount: 200, amountInCents: 20000, type: 'withdrawal' as const, month: '2025-11' },
    { id: 's-04', amount: 800, amountInCents: 80000, type: 'deposit' as const, month: '2025-12' },
    { id: 's-05', amount: 700, amountInCents: 70000, type: 'deposit' as const, month: '2026-01' },
    { id: 's-06', amount: 500, amountInCents: 50000, type: 'deposit' as const, month: '2026-03' },
    { id: 's-07', amount: 600, amountInCents: 60000, type: 'deposit' as const, month: '2026-06' },
    { id: 's-08', amount: 1000, amountInCents: 100000, type: 'deposit' as const, month: '2026-08' },
  ];

  const simulationIncomes = [
    { id: 'i-01', amount: 800, amountInCents: 80000, month: '2025-10' }, // Freelance bonus
    { id: 'i-02', amount: 1200, amountInCents: 120000, month: '2025-12' }, // Year-end bonus
    { id: 'i-03', amount: 450, amountInCents: 45000, month: '2026-04' }, // Tax refund
    { id: 'i-04', amount: 600, amountInCents: 60000, month: '2026-08' }, // Side consulting
  ];

  const simulationLoans = [
    { id: 'l-01', amount: 1500, amountInCents: 150000, month: '2025-11' }, // Personal loan taken
    { id: 'l-02', amount: 500, amountInCents: 50000, month: '2026-03' }, // Emergency short loan
  ];

  const fullSimulationRawData: RawFinancialData = {
    month: '2026-08',
    profile: simulationProfile,
    expenses: simulationExpenses,
    savingEntries: simulationSavings,
    incomeEntries: simulationIncomes,
    loansTaken: simulationLoans,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Test Scenario 1: Exact Angular Financial Math Parity & Zero-Drift Arithmetic
  // ==========================================================================
  describe('Scenario 1: Exact Angular Financial Math Parity', () => {
    it('achieves 100% mathematical parity across all 12 simulated months with zero drift', () => {
      const months = [
        '2025-09',
        '2025-10',
        '2025-11',
        '2025-12',
        '2026-01',
        '2026-02',
        '2026-03',
        '2026-04',
        '2026-05',
        '2026-06',
        '2026-07',
        '2026-08',
      ];

      for (const targetMonth of months) {
        const rawForMonth: RawFinancialData = {
          ...fullSimulationRawData,
          month: targetMonth,
        };

        const rnSummary = computeMonthSummary(rawForMonth);
        const angularResult = angularDashboardCalculationOracle(
          simulationExpenses,
          simulationSavings,
          simulationIncomes,
          simulationLoans,
          simulationProfile,
          targetMonth
        );

        // Parity assertions
        expect(rnSummary.month).toBe(targetMonth);
        expect(rnSummary.currentMonthIncome).toBeCloseTo(angularResult.currentMonthIncome, 2);
        expect(rnSummary.previousMonthRemaining).toBeCloseTo(angularResult.previousMonthRemaining, 2);
        expect(rnSummary.totalIncome).toBeCloseTo(angularResult.totalIncome, 2);
        expect(rnSummary.totalExpenses).toBeCloseTo(angularResult.totalExpenses, 2);
        expect(rnSummary.totalSavings).toBeCloseTo(angularResult.totalSavings, 2);
        expect(rnSummary.remaining).toBeCloseTo(angularResult.remaining, 2);
        expect(rnSummary.loansTakenIncome).toBeCloseTo(angularResult.loansTakenIncome, 2);
        expect(rnSummary.expenseCount).toBe(angularResult.expenseCount);

        // Exact Integer Cents Parity: totalIncome = currentMonthIncome + previousMonthRemaining
        expect(rnSummary.totalIncomeInCents).toBe(
          addCents(rnSummary.currentMonthIncomeInCents, rnSummary.previousMonthRemainingInCents)
        );

        // Verification of Remaining: remaining = totalIncome - totalExpenses - (totalSavings - savingsInExpenses)
        const curExpenses = simulationExpenses.filter((e) => e.month === targetMonth);
        const savingsInExpCents = curExpenses
          .filter((e) => e.category.toLowerCase() === 'savings')
          .reduce((sum, e) => addCents(sum, e.amountInCents), 0);
        const netSavingsDeduction = subtractCents(rnSummary.totalSavingsInCents, savingsInExpCents);
        const expectedRemainingCents = subtractCents(
          subtractCents(rnSummary.totalIncomeInCents, rnSummary.totalExpensesInCents),
          netSavingsDeduction
        );
        expect(rnSummary.remainingInCents).toBe(expectedRemainingCents);
        expect(fromCents(rnSummary.remainingInCents)).toBe(rnSummary.remaining);
      }
    });

    it('handles decimal precision with zero floating-point accumulation errors', () => {
      const fractionalRaw: RawFinancialData = {
        month: '2026-08',
        profile: { monthlySalary: 1000.33, createdAt: '2026-07-01T00:00:00.000Z' },
        expenses: [
          { id: '1', amount: 10.01, amountInCents: 1001, category: 'Food', month: '2026-07' },
          { id: '2', amount: 20.02, amountInCents: 2002, category: 'Food', month: '2026-07' },
          { id: '3', amount: 30.03, amountInCents: 3003, category: 'Food', month: '2026-08' },
        ],
        savingEntries: [
          { id: 's1', amount: 50.55, amountInCents: 5055, type: 'deposit', month: '2026-07' },
          { id: 's2', amount: 15.15, amountInCents: 1515, type: 'deposit', month: '2026-08' },
        ],
        incomeEntries: [],
        loansTaken: [],
      };

      const summary = computeMonthSummary(fractionalRaw);
      expect(summary.totalIncomeInCents).toBe(192008); // 1000.33 (current) + (1000.33 - 30.03 - 50.55) = 1920.08
      expect(summary.remainingInCents).toBe(187490); // 1920.08 - 30.03 - 15.15 = 1874.90
      expect(summary.remaining).toBe(1874.9);
    });
  });

  // ==========================================================================
  // Test Scenario 2: Multi-Month Historical Roll-Forward from User createdAt
  // ==========================================================================
  describe('Scenario 2: Multi-Month Historical Roll-Forward from createdAt', () => {
    it('resolves historical salary progression steps accurately', () => {
      const profile: UserProfileFinancials = {
        monthlySalary: 3000,
        salaries: {
          '2025-01': 2500,
          '2025-06': 2800,
          '2026-01': 3200,
        },
      };

      // Before first step -> uses earliest defined step
      expect(resolveSalaryInCents(profile, '2024-12')).toBe(toCents(2500));
      // Exact match step 1
      expect(resolveSalaryInCents(profile, '2025-01')).toBe(toCents(2500));
      // Between step 1 and step 2 -> resolves to preceding step (2500)
      expect(resolveSalaryInCents(profile, '2025-03')).toBe(toCents(2500));
      // Exact match step 2
      expect(resolveSalaryInCents(profile, '2025-06')).toBe(toCents(2800));
      // Between step 2 and step 3 -> resolves to 2800
      expect(resolveSalaryInCents(profile, '2025-11')).toBe(toCents(2800));
      // Step 3
      expect(resolveSalaryInCents(profile, '2026-01')).toBe(toCents(3200));
      // After step 3 -> resolves to latest step
      expect(resolveSalaryInCents(profile, '2026-08')).toBe(toCents(3200));
      // Fallback when salaries is empty
      expect(resolveSalaryInCents({ monthlySalary: 4200 }, '2026-08')).toBe(toCents(4200));
      // Null profile
      expect(resolveSalaryInCents(null, '2026-08')).toBe(0);
    });

    it('generates chronological month sequences correctly across calendar boundaries', () => {
      const pastMonths = getMonthsBetween('2025-09-15T10:00:00.000Z', '2026-03');
      expect(pastMonths).toEqual([
        '2025-09',
        '2025-10',
        '2025-11',
        '2025-12',
        '2026-01',
        '2026-02',
      ]);

      // Same month -> empty
      expect(getMonthsBetween('2026-03-01', '2026-03')).toEqual([]);
      // Invalid input handling
      expect(getMonthsBetween('invalid-date', '2026-03')).toEqual([]);
    });

    it('correctly deducts savings in expenses (savingsInExpenses) to prevent double subtraction', () => {
      const dataWithSavingsExpense: RawFinancialData = {
        month: '2026-08',
        profile: { monthlySalary: 5000, createdAt: '2026-08-01T00:00:00.000Z' },
        expenses: [
          { id: '1', amount: 500, amountInCents: 50000, category: 'Food', month: '2026-08' },
          // Expense logged under category 'Savings'
          { id: '2', amount: 300, amountInCents: 30000, category: 'Savings', month: '2026-08' },
        ],
        savingEntries: [
          // Matched deposit entry
          { id: 's1', amount: 300, amountInCents: 30000, type: 'deposit', month: '2026-08' },
        ],
        incomeEntries: [],
        loansTaken: [],
      };

      const summary = computeMonthSummary(dataWithSavingsExpense);
      expect(summary.totalIncomeInCents).toBe(500000);
      expect(summary.totalExpensesInCents).toBe(80000); // 500 + 300 = 800
      expect(summary.totalSavingsInCents).toBe(30000);
      // netSavingsDeduction = totalSavings (30000) - savingsInExpenses (30000) = 0
      // remaining = 500000 - 80000 - 0 = 420000 ($4,200)
      expect(summary.remainingInCents).toBe(420000);
      expect(summary.remaining).toBe(4200);
    });

    it('incorporates loans taken as income inflow in current and historical carryover', () => {
      const dataWithLoans: RawFinancialData = {
        month: '2026-08',
        profile: { monthlySalary: 3000, createdAt: '2026-07-01T00:00:00.000Z' },
        expenses: [
          { id: '1', amount: 2000, amountInCents: 200000, category: 'General', month: '2026-07' },
          { id: '2', amount: 1500, amountInCents: 150000, category: 'General', month: '2026-08' },
        ],
        savingEntries: [],
        incomeEntries: [],
        loansTaken: [
          { id: 'l1', amount: 1000, amountInCents: 100000, month: '2026-07' }, // Loan in past month
          { id: 'l2', amount: 500, amountInCents: 50000, month: '2026-08' }, // Loan in active month
        ],
      };

      const summary = computeMonthSummary(dataWithLoans);
      // Past month income = 3000 (salary) + 1000 (loan) = 4000
      // Past month expenses = 2000
      // Past month remaining = 2000 carryover
      expect(summary.previousMonthRemainingInCents).toBe(200000);
      expect(summary.previousMonthRemaining).toBe(2000);

      // Current month income = 3000 (salary) + 500 (loan) = 3500
      expect(summary.currentMonthIncomeInCents).toBe(350000);
      expect(summary.loansTakenIncomeInCents).toBe(50000);
      expect(summary.loansTakenIncome).toBe(500);

      // Total Income = 3500 + 2000 = 5500
      expect(summary.totalIncomeInCents).toBe(550000);
      expect(summary.totalIncome).toBe(5500);

      // Remaining = 5500 - 1500 = 4000
      expect(summary.remainingInCents).toBe(400000);
      expect(summary.remaining).toBe(4000);
    });

    it('accumulates rolling carryover across all 12 simulated months accurately', () => {
      const summaryAug2026 = computeMonthSummary(fullSimulationRawData);
      expect(summaryAug2026.month).toBe('2026-08');
      expect(summaryAug2026.totalIncomeInCents).toBeGreaterThan(summaryAug2026.currentMonthIncomeInCents);
      expect(summaryAug2026.previousMonthRemainingInCents).toBeGreaterThan(0);
      expect(summaryAug2026.expenseCount).toBe(5);
    });
  });

  // ==========================================================================
  // Test Scenario 3: SVG CategoryDonutChart Rendering & Interactive State
  // ==========================================================================
  describe('Scenario 3: SVG CategoryDonutChart Rendering & Slices', () => {
    const breakdowns: CategoryBreakdown[] = [
      { category: 'Housing', totalInCents: 140000, total: 1400, count: 1, percentage: 49.9 },
      { category: 'Food', totalInCents: 65075, total: 650.75, count: 1, percentage: 23.2 },
      { category: 'Savings', totalInCents: 30000, total: 300, count: 1, percentage: 10.7 },
      { category: 'Transport', totalInCents: 25025, total: 250.25, count: 1, percentage: 8.9 },
      { category: 'Utilities', totalInCents: 20000, total: 200, count: 1, percentage: 7.1 },
    ];

    it('renders all multi-category SVG slices, center amount readout, and color legend', () => {
      const { getByTestId, getByText } = render(
        <CategoryDonutChart data={breakdowns} size={240} />
      );

      expect(getByTestId('category-donut-chart')).toBeTruthy();
      expect(getByText('Spending by Category')).toBeTruthy();
      expect(getByText('5 transactions')).toBeTruthy();

      // Check all slice paths
      expect(getByTestId('donut-slice-Housing')).toBeTruthy();
      expect(getByTestId('donut-slice-Food')).toBeTruthy();
      expect(getByTestId('donut-slice-Savings')).toBeTruthy();
      expect(getByTestId('donut-slice-Transport')).toBeTruthy();
      expect(getByTestId('donut-slice-Utilities')).toBeTruthy();

      // Check legend items
      expect(getByTestId('legend-item-Housing')).toBeTruthy();
      expect(getByTestId('legend-item-Food')).toBeTruthy();
      expect(getByTestId('legend-item-Savings')).toBeTruthy();
      expect(getByTestId('legend-item-Transport')).toBeTruthy();
      expect(getByTestId('legend-item-Utilities')).toBeTruthy();

      // Center label: total spent ($2,801.00)
      expect(getByText('TOTAL SPENT')).toBeTruthy();
      expect(getByText('$2,801.00')).toBeTruthy();
    });

    it('updates center readout and triggers callback on slice selection and toggles back', () => {
      const onSelect = jest.fn();
      const { getByTestId, getByText, queryByText } = render(
        <CategoryDonutChart data={breakdowns} onSelectCategory={onSelect} />
      );

      // Tap 'Food' slice
      fireEvent.press(getByTestId('donut-slice-Food'));
      expect(onSelect).toHaveBeenCalledWith('Food');
      expect(getByText('FOOD')).toBeTruthy();
      expect(getByText('$650.75')).toBeTruthy();

      // Tap 'Food' slice again -> deselect
      fireEvent.press(getByTestId('donut-slice-Food'));
      expect(getByText('TOTAL SPENT')).toBeTruthy();
      expect(getByText('$2,801.00')).toBeTruthy();
      expect(queryByText('FOOD')).toBeNull();
    });

    it('handles legend item tap to focus category slice', () => {
      const onSelect = jest.fn();
      const { getByTestId, getByText } = render(
        <CategoryDonutChart data={breakdowns} onSelectCategory={onSelect} />
      );

      fireEvent.press(getByTestId('legend-item-Transport'));
      expect(onSelect).toHaveBeenCalledWith('Transport');
      expect(getByText('TRANSPORT')).toBeTruthy();
      expect(getByText('$250.25')).toBeTruthy();
    });

    it('renders clean empty state view when no category expenses exist', () => {
      const { getByTestId, getByText } = render(<CategoryDonutChart data={[]} />);
      expect(getByTestId('empty-donut-chart')).toBeTruthy();
      expect(getByText('No category spending recorded')).toBeTruthy();
    });
  });

  // ==========================================================================
  // Test Scenario 4: SVG MonthlyTrendBarChart Dual Bars & Tooltip
  // ==========================================================================
  describe('Scenario 4: SVG MonthlyTrendBarChart Historical Dual Bars', () => {
    const pastMonths = getPastMonthKeys(6, '2026-08');
    const trendSeries = computeMonthlyTrend(
      simulationExpenses,
      simulationSavings,
      pastMonths
    );

    it('renders 6-month historical dual bars (Expenses vs Savings) with grid and labels', () => {
      const { getByTestId, getByText } = render(
        <MonthlyTrendBarChart trends={trendSeries} />
      );

      expect(getByTestId('monthly-trend-bar-chart')).toBeTruthy();
      expect(getByText('Expenses vs Savings')).toBeTruthy();
      expect(getByText('Last 6 Months')).toBeTruthy();

      // Verify each month's dual bars exist
      for (const monthKey of pastMonths) {
        expect(getByTestId(`bar-expense-${monthKey}`)).toBeTruthy();
        expect(getByTestId(`bar-savings-${monthKey}`)).toBeTruthy();
        expect(getByTestId(`label-month-${monthKey}`)).toBeTruthy();
      }
    });

    it('taps bar to display interactive tooltip badge and dismisses on second tap', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <MonthlyTrendBarChart trends={trendSeries} />
      );

      expect(queryByTestId('trend-tooltip-badge')).toBeNull();

      // Tap on 2026-08 expense bar
      fireEvent.press(getByTestId('bar-expense-2026-08'));

      expect(getByTestId('trend-tooltip-badge')).toBeTruthy();
      expect(getByText('2026-08')).toBeTruthy();
      expect(getByText('Exp: $2,801.00')).toBeTruthy();
      expect(getByText('Sav: $1,000.00')).toBeTruthy();

      // Tap again to dismiss
      fireEvent.press(getByTestId('bar-expense-2026-08'));
      expect(queryByTestId('trend-tooltip-badge')).toBeNull();
    });

    it('renders empty trend state when all trends have zero values', () => {
      const emptyTrends: MonthlyTrend[] = [
        { month: '2026-07', totalExpensesInCents: 0, totalExpenses: 0, totalSavingsInCents: 0, totalSavings: 0 },
        { month: '2026-08', totalExpensesInCents: 0, totalExpenses: 0, totalSavingsInCents: 0, totalSavings: 0 },
      ];

      const { getByTestId, getByText } = render(<MonthlyTrendBarChart trends={emptyTrends} />);
      expect(getByTestId('empty-trend-chart')).toBeTruthy();
      expect(getByText('No historical trend data')).toBeTruthy();
    });
  });

  // ==========================================================================
  // Test Scenario 5: Full Integration & Month Navigation Transitions
  // ==========================================================================
  describe('Scenario 5: Full Dashboard Integration & Month Navigation Transitions', () => {
    const mockUser = {
      uid: 'user_sim_777',
      email: 'finance_pro@example.com',
      displayName: 'Finance Master',
    };

    const mockCategoryContext = {
      categories: [
        { id: 'c-1', value: 'Housing', label: 'Housing', icon: '🏠', isCustom: false },
        { id: 'c-2', value: 'Food', label: 'Food', icon: '🍕', isCustom: false },
        { id: 'c-3', value: 'Transport', label: 'Transport', icon: '🚌', isCustom: false },
        { id: 'c-4', value: 'Savings', label: 'Savings', icon: '🏦', isCustom: false },
        { id: 'c-5', value: 'Utilities', label: 'Utilities', icon: '💡', isCustom: false },
      ],
      builtInCategories: [],
      customCategories: [],
      isLoading: false,
      addCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getCategoryByValue: (val: string) => ({
        id: val,
        value: val,
        label: val,
        icon: '📁',
        isCustom: false,
      }),
      refreshCategories: jest.fn(),
    };

    const mockBudgetContext = {
      activeMonth: '2026-08',
      budgets: [],
      budgetUsages: [],
      summary: {
        totalLimitInCents: 350000,
        totalLimit: 3500,
        totalSpentInCents: 280100,
        totalSpent: 2801,
        totalRemainingInCents: 69900,
        totalRemaining: 699,
        percentage: 80.0,
        thresholdState: 'warning' as const,
      },
      isLoading: false,
      setActiveMonth: jest.fn(),
      setBudget: jest.fn(),
      deleteBudget: jest.fn(),
      refreshBudgets: jest.fn(),
    };

    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        profile: { displayName: 'Finance Master' },
        logout: jest.fn(),
        isLoading: false,
        isAuthenticated: true,
      });

      (useExpenses as jest.Mock).mockReturnValue({
        expenses: simulationExpenses.map((e) => ({
          ...e,
          title: `${e.category} item`,
          description: '',
          date: `${e.month}-10T10:00:00.000Z`,
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: `${e.month}-10T10:00:00.000Z`,
          updatedAt: `${e.month}-10T10:00:00.000Z`,
        })),
        pendingSyncCount: 0,
        isLoading: false,
        isSyncing: false,
        isOnline: true,
        addExpense: jest.fn(),
        updateExpense: jest.fn(),
        deleteExpense: jest.fn(),
        getExpenseById: jest.fn(),
        syncQueue: jest.fn(),
        refreshExpenses: jest.fn(),
      });

      // Implement dynamic simulated DashboardService response based on requested month
      (DashboardService.getMonthSummary as jest.Mock).mockImplementation((_uid, month) => {
        return Promise.resolve(
          computeMonthSummary({
            ...fullSimulationRawData,
            month,
          })
        );
      });

      (DashboardService.getMonthlyTrend as jest.Mock).mockImplementation((_uid, count = 6, refMonth = '2026-08') => {
        const past = getPastMonthKeys(count, refMonth);
        return Promise.resolve(
          computeMonthlyTrend(simulationExpenses, simulationSavings, past)
        );
      });

      (DashboardService.getCategoryBreakdown as jest.Mock).mockImplementation((_uid, month) => {
        return Promise.resolve(
          computeCategoryBreakdown(simulationExpenses, month)
        );
      });
    });

    const renderIntegratedDashboard = (initialMonth = '2026-08') => {
      return render(
        <CategoryContext.Provider value={mockCategoryContext}>
          <BudgetContext.Provider value={mockBudgetContext}>
            <DashboardProvider initialMonth={initialMonth}>
              <AppDashboardScreen />
            </DashboardProvider>
          </BudgetContext.Provider>
        </CategoryContext.Provider>
      );
    };

    it('renders full dashboard, loads initial active month data, and displays cards and charts', async () => {
      const { getByTestId, getByText } = renderIntegratedDashboard('2026-08');

      // Wait for data resolution
      await waitFor(() => {
        expect(getByTestId('month-navigator')).toBeTruthy();
        expect(getByText('August 2026')).toBeTruthy();
      });

      // Summary Cards Grid - wait for asynchronous DashboardProvider data load
      await waitFor(() => {
        const savingsCard = getByTestId('summary-card-savings');
        expect(within(savingsCard).getByText('$1,000.00')).toBeTruthy();
      });

      const incomeCard = getByTestId('summary-card-income');
      expect(incomeCard).toBeTruthy();
      const expensesCard = getByTestId('summary-card-expenses');
      expect(within(expensesCard).getByText('$2,801.00')).toBeTruthy();

      // Charts
      expect(getByTestId('category-donut-chart')).toBeTruthy();
      expect(getByTestId('monthly-trend-bar-chart')).toBeTruthy();
    });

    it('transitions across past and future months and updates metrics dynamically', async () => {
      const { getByTestId, getByText } = renderIntegratedDashboard('2026-08');

      await waitFor(() => {
        expect(getByText('August 2026')).toBeTruthy();
      });

      // 1. Step backward to July 2026
      const prevBtn = getByTestId('month-prev-btn');
      await act(async () => {
        fireEvent.press(prevBtn);
      });

      await waitFor(() => {
        expect(getByText('July 2026')).toBeTruthy();
      });

      expect(DashboardService.getMonthSummary).toHaveBeenCalledWith('user_sim_777', '2026-07');
      expect(DashboardService.getMonthlyTrend).toHaveBeenCalledWith('user_sim_777', 6, '2026-07');
      expect(DashboardService.getCategoryBreakdown).toHaveBeenCalledWith('user_sim_777', '2026-07');

      // 2. Step backward past year boundary (from 2026-01 to 2025-12)
      const janRender = renderIntegratedDashboard('2026-01');
      await waitFor(() => {
        expect(janRender.getByText('January 2026')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(janRender.getByTestId('month-prev-btn'));
      });

      await waitFor(() => {
        expect(janRender.getByText('December 2025')).toBeTruthy();
      });

      expect(DashboardService.getMonthSummary).toHaveBeenCalledWith('user_sim_777', '2025-12');
    });

    it('renders and operates Reset to Current Month button when viewing a historical month', async () => {
      const currentMonthStr = format(new Date(), 'yyyy-MM');
      const { getByTestId, getByText } = renderIntegratedDashboard('2025-09');

      await waitFor(() => {
        expect(getByText('September 2025')).toBeTruthy();
      });

      const resetBtn = getByTestId('month-current-reset-btn');
      expect(resetBtn).toBeTruthy();

      await act(async () => {
        fireEvent.press(resetBtn);
      });

      expect(DashboardService.getMonthSummary).toHaveBeenCalledWith('user_sim_777', currentMonthStr);
    });
  });
});
