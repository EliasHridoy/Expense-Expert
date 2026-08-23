import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BudgetService, BUDGETS_CACHE_KEY_PREFIX } from '../../src/features/budgets/services/budget.service';
import {
  calculateBudgetUsage,
  calculateTotalBudgetSummary,
  getThresholdColor,
} from '../../src/features/budgets/utils/budget.util';
import {
  CategoryBudget,
  BudgetUsage,
  BudgetSummary,
  SetBudgetDto,
} from '../../src/features/budgets/types/budget.types';
import { Expense } from '../../src/features/expenses/types/expense.types';
import { CategoryBudgetCard } from '../../src/features/budgets/components/CategoryBudgetCard';
import { BudgetSummaryCard } from '../../src/features/budgets/components/BudgetSummaryCard';
import { BudgetProgressBar } from '../../src/features/budgets/components/BudgetProgressBar';
import BudgetsScreen from '../../app/(app)/budgets/index';
import { BudgetContext, BudgetContextType } from '../../src/features/budgets/context/BudgetContext';
import { CategoryContext } from '../../src/features/categories/context/CategoryContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  where,
} from 'firebase/firestore';

// Mock dependencies
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection-ref'),
  doc: jest.fn((_db, path, id) => `mock-doc-ref:${path}/${id}`),
  setDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  getDocs: jest.fn(),
  query: jest.fn(() => 'mock-query'),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  onSnapshot: jest.fn(),
}));

jest.mock('../../src/config/firebase', () => ({
  db: {},
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

// Mock useCategories hook used in CategoryBudgetCard
jest.mock('../../src/features/categories/hooks/useCategories', () => ({
  useCategories: () => ({
    getCategoryByValue: (cat: string) => ({
      value: cat,
      label:
        cat === 'food'
          ? 'Food & Dining'
          : cat === 'housing'
          ? 'Housing & Rent'
          : cat === 'transport'
          ? 'Transportation'
          : cat === 'entertainment'
          ? 'Entertainment'
          : cat === 'utilities'
          ? 'Utilities & Bills'
          : cat === 'healthcare'
          ? 'Health & Wellness'
          : cat.charAt(0).toUpperCase() + cat.slice(1),
      icon:
        cat === 'food'
          ? '🍔'
          : cat === 'housing'
          ? '🏠'
          : cat === 'transport'
          ? '🚗'
          : cat === 'entertainment'
          ? '🎬'
          : cat === 'utilities'
          ? '💡'
          : cat === 'healthcare'
          ? '🩺'
          : '🏷️',
      isCustom: false,
    }),
  }),
}));

describe('Budgeting & Threshold Warnings Module - Dummy Data Simulation Suite', () => {
  const userId = 'user_sim_999';
  const simulationMonth = '2026-08';

  // Helper factory for realistic expenses
  const createSimulatedExpense = (
    category: string,
    amountInCents: number,
    title = 'Simulated Expense',
    month = simulationMonth,
    day = '15'
  ): Expense => ({
    id: `sim_exp_${Math.random().toString(36).substring(2, 9)}`,
    title,
    description: `Auto-generated simulation expense for ${category}`,
    amount: amountInCents / 100,
    amountInCents,
    category,
    date: `${month}-${day.padStart(2, '0')}T10:00:00.000Z`,
    month,
    isLoan: false,
    loanPersonId: null,
    loanCleared: false,
    loanRepaid: 0,
    loanTakenId: null,
    draftId: null,
    installmentIndex: null,
    createdAt: `${month}-01T00:00:00.000Z`,
    updatedAt: `${month}-01T00:00:00.000Z`,
  });

  // Helper factory for category budgets
  const createSimulatedBudget = (
    category: string,
    limitInCents: number,
    month = simulationMonth
  ): CategoryBudget => ({
    id: `${month}_${category}`,
    userId,
    category,
    month,
    limit: limitInCents / 100,
    limitInCents,
    createdAt: `${month}-01T00:00:00.000Z`,
    updatedAt: `${month}-01T00:00:00.000Z`,
  });

  const defaultCategoryContext = {
    categories: [
      { id: 'cat-1', value: 'food', label: 'Food & Dining', icon: '🍔', isCustom: false },
      { id: 'cat-2', value: 'housing', label: 'Housing & Rent', icon: '🏠', isCustom: false },
      { id: 'cat-3', value: 'transport', label: 'Transportation', icon: '🚗', isCustom: false },
      { id: 'cat-4', value: 'entertainment', label: 'Entertainment', icon: '🎬', isCustom: false },
      { id: 'cat-5', value: 'utilities', label: 'Utilities & Bills', icon: '💡', isCustom: false },
      { id: 'cat-6', value: 'healthcare', label: 'Health & Wellness', icon: '🩺', isCustom: false },
    ],
    builtInCategories: [],
    customCategories: [],
    isLoading: false,
    addCategory: jest.fn(),
    deleteCategory: jest.fn(),
    getCategoryByValue: (cat: string) => ({
      id: cat,
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      icon: '🏷️',
      isCustom: false,
    }),
    refreshCategories: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Setting Monthly Category Budgets with Deterministic Composite Keys
  // =========================================================================
  describe('1. Deterministic Composite Key Generation & Budget Persistence', () => {
    it('generates consistent deterministic document ID format "{month}_{category}"', () => {
      const cases = [
        { month: '2026-08', category: 'food', expected: '2026-08_food' },
        { month: '2026-08', category: 'housing', expected: '2026-08_housing' },
        { month: '2026-09', category: 'entertainment', expected: '2026-09_entertainment' },
        { month: '2027-01', category: 'custom_health', expected: '2027-01_custom_health' },
      ];

      cases.forEach(({ month, category, expected }) => {
        expect(BudgetService.getBudgetDocId(month, category)).toBe(expected);
      });
    });

    it('persists budget to Firestore using deterministic key and integer cents conversion', async () => {
      const dto: SetBudgetDto = {
        month: '2026-08',
        category: 'food',
        limit: 500.0, // $500.00
      };

      const result = await BudgetService.setCategoryBudget(userId, dto);

      expect(result.id).toBe('2026-08_food');
      expect(result.limit).toBe(500);
      expect(result.limitInCents).toBe(50000);
      expect(result.category).toBe('food');
      expect(result.month).toBe('2026-08');

      // Verify Firestore document reference matches path users/{userId}/budgets/{docId}
      expect(doc).toHaveBeenCalledWith({}, `users/${userId}/budgets`, '2026-08_food');
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref:users/user_sim_999/budgets/2026-08_food',
        expect.objectContaining({
          id: '2026-08_food',
          userId,
          category: 'food',
          month: '2026-08',
          limit: 500,
          limitInCents: 50000,
        }),
        { merge: true }
      );

      // Verify offline cache is populated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `${BUDGETS_CACHE_KEY_PREFIX}_${userId}_2026-08`,
        expect.stringContaining('2026-08_food')
      );
    });

    it('handles floating string input without precision loss (e.g. "125.75")', async () => {
      const dto: SetBudgetDto = {
        month: '2026-08',
        category: 'transport',
        limit: '125.75',
      };

      const result = await BudgetService.setCategoryBudget(userId, dto);

      expect(result.id).toBe('2026-08_transport');
      expect(result.limit).toBe(125.75);
      expect(result.limitInCents).toBe(12575);
    });
  });

  // =========================================================================
  // 2. Zero-Drift Spent Calculation Against Multiple Fractional Expenses
  // =========================================================================
  describe('2. Zero-Drift Spent Calculation with Rich Dummy Expenses', () => {
    it('eliminates floating-point accumulation drift across multiple fractional expenses', () => {
      const budget = createSimulatedBudget('food', 50000); // $500.00 limit

      // Simulating a stream of fractional dollar amounts that would cause IEEE 754 float drift:
      // 19.99 + 33.33 + 14.28 + 89.95 + 142.45 + 0.01 + 199.99 = 500.00 exactly
      const simulatedExpenses: Expense[] = [
        createSimulatedExpense('food', 1999, 'Coffee & Pastry', '2026-08', '02'), // $19.99
        createSimulatedExpense('food', 3333, 'Fast Food Lunch', '2026-08', '05'), // $33.33
        createSimulatedExpense('food', 1428, 'Convenience Snack', '2026-08', '08'), // $14.28
        createSimulatedExpense('food', 8995, 'Weekly Groceries Pt 1', '2026-08', '12'), // $89.95
        createSimulatedExpense('food', 14245, 'Weekly Groceries Pt 2', '2026-08', '19'), // $142.45
        createSimulatedExpense('food', 1, 'Micro tip', '2026-08', '20'), // $0.01
        createSimulatedExpense('food', 19999, 'Family Dinner', '2026-08', '25'), // $199.99
      ];

      const usage = calculateBudgetUsage(budget, simulatedExpenses);

      // Verify exact integer cents summation: 1999 + 3333 + 1428 + 8995 + 14245 + 1 + 19999 = 50000
      expect(usage.spentInCents).toBe(50000);
      expect(usage.spent).toBe(500.0);
      expect(usage.remainingInCents).toBe(0);
      expect(usage.remaining).toBe(0.0);
      expect(usage.percentage).toBe(100.0);
      expect(usage.isExceeded).toBe(true);
      expect(usage.thresholdState).toBe('exceeded');
    });

    it('strictly isolates category and month matching during spending calculation', () => {
      const budget = createSimulatedBudget('food', 50000, '2026-08'); // $500.00 for Aug 2026

      const mixedExpenses: Expense[] = [
        // Aug 2026 - Food (Matches)
        createSimulatedExpense('food', 15000, 'Aug Food 1', '2026-08'), // $150.00
        createSimulatedExpense('food', 10000, 'Aug Food 2', '2026-08'), // $100.00
        // Aug 2026 - Other Categories (Should be ignored for food budget)
        createSimulatedExpense('transport', 8000, 'Aug Gas', '2026-08'), // $80.00
        createSimulatedExpense('housing', 120000, 'Aug Rent', '2026-08'), // $1200.00
        // Jul 2026 & Sep 2026 - Food (Different months, should be ignored)
        createSimulatedExpense('food', 25000, 'Jul Food', '2026-07'), // $250.00
        createSimulatedExpense('food', 30000, 'Sep Food', '2026-09'), // $300.00
      ];

      const usage = calculateBudgetUsage(budget, mixedExpenses);

      expect(usage.spentInCents).toBe(25000);
      expect(usage.spent).toBe(250.0);
      expect(usage.remainingInCents).toBe(25000);
      expect(usage.remaining).toBe(250.0);
      expect(usage.percentage).toBe(50.0);
      expect(usage.thresholdState).toBe('under');
    });
  });

  // =========================================================================
  // 3. 3-Tier Threshold Warning Verification (Under, Near Limit, Exceeded)
  // =========================================================================
  describe('3. 3-Tier Threshold Warning Verification', () => {
    const baselineBudget = createSimulatedBudget('food', 50000); // $500.00 limit

    describe('Tier 1: Under Budget (<80% spent)', () => {
      it('evaluates 0% spent (no expenses) with Emerald styling & "under" status', () => {
        const usage = calculateBudgetUsage(baselineBudget, []);
        const colors = getThresholdColor(usage.thresholdState);

        expect(usage.percentage).toBe(0);
        expect(usage.thresholdState).toBe('under');
        expect(usage.isNearLimit).toBe(false);
        expect(usage.isExceeded).toBe(false);
        expect(usage.remainingInCents).toBe(50000);

        expect(colors.barColor).toBe('bg-emerald-500');
        expect(colors.textColor).toContain('text-emerald');
        expect(colors.badgeBg).toContain('bg-emerald');
      });

      it('evaluates 50% spent ($250/$500) with Emerald styling and renders "On Track" badge', () => {
        const expenses = [createSimulatedExpense('food', 25000)];
        const usage = calculateBudgetUsage(baselineBudget, expenses);
        const colors = getThresholdColor(usage.thresholdState);

        expect(usage.percentage).toBe(50);
        expect(usage.thresholdState).toBe('under');
        expect(colors.barColor).toBe('bg-emerald-500');

        // UI Verification
        const { getByTestId, getByText } = render(<CategoryBudgetCard usage={usage} />);

        expect(getByText('On Track')).toBeTruthy();
        expect(getByTestId('category-budget-card-spent')).toHaveTextContent('$250.00');
        expect(getByTestId('category-budget-card-limit')).toHaveTextContent('$500.00');
        expect(getByTestId('category-budget-card-remaining')).toHaveTextContent('$250.00');

        const progressBarFill = getByTestId('budget-progress-bar-fill');
        expect(progressBarFill.props.style.width).toBe('50%');
      });

      it('evaluates 79.9% spent ($399.50/$500) as Under Budget right below 80% threshold', () => {
        const expenses = [createSimulatedExpense('food', 39950)]; // $399.50 -> 79.9%
        const usage = calculateBudgetUsage(baselineBudget, expenses);

        expect(usage.percentage).toBe(79.9);
        expect(usage.thresholdState).toBe('under');
        expect(usage.isNearLimit).toBe(false);
        expect(usage.isExceeded).toBe(false);
        expect(usage.remainingInCents).toBe(10050);
      });
    });

    describe('Tier 2: Near Limit (80% - 99.9% spent)', () => {
      it('evaluates exact 80.0% boundary condition ($400/$500) as Amber warning', () => {
        const expenses = [createSimulatedExpense('food', 40000)]; // $400.00
        const usage = calculateBudgetUsage(baselineBudget, expenses);
        const colors = getThresholdColor(usage.thresholdState);

        expect(usage.percentage).toBe(80.0);
        expect(usage.thresholdState).toBe('warning');
        expect(usage.isNearLimit).toBe(true);
        expect(usage.isExceeded).toBe(false);
        expect(usage.remainingInCents).toBe(10000);

        expect(colors.barColor).toBe('bg-amber-500');
        expect(colors.textColor).toContain('text-amber');
        expect(colors.badgeBg).toContain('bg-amber');

        // UI Verification
        const { getByTestId, getByText } = render(<CategoryBudgetCard usage={usage} />);

        expect(getByText('Near Limit (80%+)')).toBeTruthy();
        expect(getByTestId('category-budget-card-spent')).toHaveTextContent('$400.00');
        expect(getByTestId('category-budget-card-remaining')).toHaveTextContent('$100.00');

        const progressBar = getByTestId('budget-progress-bar-status');
        expect(progressBar).toHaveTextContent('Near Limit');
      });

      it('evaluates 95.0% spent ($475/$500) with Amber warning badge and remaining balance', () => {
        const expenses = [createSimulatedExpense('food', 47500)]; // $475.00
        const usage = calculateBudgetUsage(baselineBudget, expenses);

        expect(usage.percentage).toBe(95.0);
        expect(usage.thresholdState).toBe('warning');
        expect(usage.isNearLimit).toBe(true);
        expect(usage.remainingInCents).toBe(2500);
      });

      it('evaluates 99.9% spent ($499.50/$500) right below 100% as Amber warning', () => {
        const expenses = [createSimulatedExpense('food', 49950)]; // $499.50
        const usage = calculateBudgetUsage(baselineBudget, expenses);

        expect(usage.percentage).toBe(99.9);
        expect(usage.thresholdState).toBe('warning');
        expect(usage.isNearLimit).toBe(true);
        expect(usage.isExceeded).toBe(false);
        expect(usage.remainingInCents).toBe(50);
        expect(usage.remaining).toBe(0.5);
      });
    });

    describe('Tier 3: Exceeded (>=100% spent)', () => {
      it('evaluates exact 100.0% boundary condition ($500/$500) as Rose exceeded with 0 remaining', () => {
        const expenses = [createSimulatedExpense('food', 50000)]; // $500.00
        const usage = calculateBudgetUsage(baselineBudget, expenses);
        const colors = getThresholdColor(usage.thresholdState);

        expect(usage.percentage).toBe(100.0);
        expect(usage.thresholdState).toBe('exceeded');
        expect(usage.isExceeded).toBe(true);
        expect(usage.isNearLimit).toBe(false);
        expect(usage.remainingInCents).toBe(0);
        expect(usage.remaining).toBe(0);

        expect(colors.barColor).toBe('bg-rose-500');
        expect(colors.textColor).toContain('text-rose');
        expect(colors.badgeBg).toContain('bg-rose');

        // UI Verification
        const { getByTestId, getByText } = render(<CategoryBudgetCard usage={usage} />);

        expect(getByText('Exceeded by $0.00')).toBeTruthy();
        expect(getByTestId('category-budget-card-spent')).toHaveTextContent('$500.00');
        expect(getByTestId('category-budget-card-remaining')).toHaveTextContent('-$0.00');

        const progressBar = getByTestId('budget-progress-bar-status');
        expect(progressBar).toHaveTextContent('Over Budget');
      });

      it('evaluates 125% spent ($625/$500) with Rose warning badge, negative remaining balance, and clamped progress bar', () => {
        const expenses = [
          createSimulatedExpense('food', 35000), // $350.00
          createSimulatedExpense('food', 27500), // $275.00 -> Total $625.00
        ];
        const usage = calculateBudgetUsage(baselineBudget, expenses);

        expect(usage.percentage).toBe(125.0);
        expect(usage.thresholdState).toBe('exceeded');
        expect(usage.isExceeded).toBe(true);
        expect(usage.remainingInCents).toBe(-12500);
        expect(usage.remaining).toBe(-125.0);

        // UI Verification
        const { getByTestId, getByText } = render(<CategoryBudgetCard usage={usage} />);

        expect(getByText('Exceeded by $125.00')).toBeTruthy();
        expect(getByTestId('category-budget-card-spent')).toHaveTextContent('$625.00');
        expect(getByTestId('category-budget-card-remaining')).toHaveTextContent('-$125.00');

        // Progress bar percentage displayed is 125.0% but visual bar width is clamped to 100%
        expect(getByTestId('budget-progress-bar-percentage')).toHaveTextContent('125.0%');
        const progressBarFill = getByTestId('budget-progress-bar-fill');
        expect(progressBarFill.props.style.width).toBe('100%');
      });
    });
  });

  // =========================================================================
  // 4. Budget Summary Aggregations Across Multiple Categories
  // =========================================================================
  describe('4. Multi-Category Budget Summary Aggregations', () => {
    const simulatedBudgets: CategoryBudget[] = [
      createSimulatedBudget('food', 60000), // $600.00
      createSimulatedBudget('housing', 150000), // $1,500.00
      createSimulatedBudget('transport', 30000), // $300.00
      createSimulatedBudget('entertainment', 20000), // $200.00
      createSimulatedBudget('utilities', 25000), // $250.00
      createSimulatedBudget('healthcare', 15000), // $150.00
    ]; // Total Budget Limit = $3,000.00 (300,000 cents)

    it('accurately aggregates limits, spent, remaining, and overall percentage across 6 categories', () => {
      const multiCategoryExpenses: Expense[] = [
        // Food: $540 / $600 (90% - Near limit)
        createSimulatedExpense('food', 30000),
        createSimulatedExpense('food', 24000),

        // Housing: $1,500 / $1,500 (100% - Exact limit)
        createSimulatedExpense('housing', 150000),

        // Transport: $150 / $300 (50% - Under)
        createSimulatedExpense('transport', 15000),

        // Entertainment: $260 / $200 (130% - Exceeded by $60)
        createSimulatedExpense('entertainment', 26000),

        // Utilities: $180 / $250 (72% - Under)
        createSimulatedExpense('utilities', 18000),

        // Healthcare: $0 / $150 (0% - Under)
      ];
      // Total Spent = 54000 + 150000 + 15000 + 26000 + 18000 + 0 = 263,000 cents ($2,630.00)
      // Total Limit = 300,000 cents ($3,000.00)
      // Total Remaining = 37,000 cents ($370.00)
      // Overall % = 2630 / 3000 = 87.666... -> 87.7% (Warning)

      const summary = calculateTotalBudgetSummary(simulatedBudgets, multiCategoryExpenses, simulationMonth);

      expect(summary.totalLimitInCents).toBe(300000);
      expect(summary.totalLimit).toBe(3000.0);
      expect(summary.totalSpentInCents).toBe(263000);
      expect(summary.totalSpent).toBe(2630.0);
      expect(summary.totalRemainingInCents).toBe(37000);
      expect(summary.totalRemaining).toBe(370.0);
      expect(summary.percentage).toBe(87.7);
      expect(summary.thresholdState).toBe('warning');

      // Verify UI representation in BudgetSummaryCard
      const { getByTestId } = render(
        <BudgetSummaryCard summary={summary} activeMonth={simulationMonth} />
      );

      expect(getByTestId('budget-summary-card-spent')).toHaveTextContent('$2,630.00');
      expect(getByTestId('budget-summary-card-limit')).toHaveTextContent('$3,000.00');
      expect(getByTestId('budget-summary-card-remaining')).toHaveTextContent('$370.00');
      expect(getByTestId('budget-progress-bar-status')).toHaveTextContent('Near Limit');
      expect(getByTestId('budget-progress-bar-percentage')).toHaveTextContent('87.7%');
    });

    it('aggregates to overall "exceeded" state when total spending exceeds global limit', () => {
      const heavyExpenses: Expense[] = [
        createSimulatedExpense('food', 80000), // $800
        createSimulatedExpense('housing', 150000), // $1500
        createSimulatedExpense('transport', 40000), // $400
        createSimulatedExpense('entertainment', 35000), // $350
        createSimulatedExpense('utilities', 25000), // $250
        createSimulatedExpense('healthcare', 20000), // $200
      ];
      // Total Spent = 350,000 cents ($3,500.00) vs Limit 300,000 ($3,000.00)
      // Over by $500.00 (116.7%)

      const summary = calculateTotalBudgetSummary(simulatedBudgets, heavyExpenses, simulationMonth);

      expect(summary.totalLimitInCents).toBe(300000);
      expect(summary.totalSpentInCents).toBe(350000);
      expect(summary.totalRemainingInCents).toBe(-50000);
      expect(summary.totalRemaining).toBe(-500.0);
      expect(summary.percentage).toBe(116.7);
      expect(summary.thresholdState).toBe('exceeded');

      const { getByTestId, getByText } = render(
        <BudgetSummaryCard summary={summary} activeMonth={simulationMonth} />
      );

      expect(getByText('Over By')).toBeTruthy();
      expect(getByTestId('budget-summary-card-spent')).toHaveTextContent('$3,500.00');
      expect(getByTestId('budget-summary-card-remaining')).toHaveTextContent('-$500.00');
      expect(getByTestId('budget-progress-bar-status')).toHaveTextContent('Over Budget');
    });
  });

  // =========================================================================
  // 5. Dynamic Lifecycle Simulation: Step-by-Step Transition Across Tiers
  // =========================================================================
  describe('5. Step-by-Step Spending Stream Lifecycle Simulation', () => {
    const monthlyBudget = createSimulatedBudget('food', 50000); // $500.00

    it('simulates progressive expense additions transitioning smoothly from Under -> Near Limit -> Exceeded', () => {
      const expenseStream: Expense[] = [];

      // Step 1: Initial state ($0 spent)
      let usage = calculateBudgetUsage(monthlyBudget, expenseStream);
      expect(usage.percentage).toBe(0);
      expect(usage.thresholdState).toBe('under');
      expect(usage.remaining).toBe(500);

      // Step 2: Add initial groceries ($150.00 -> 30% spent)
      expenseStream.push(createSimulatedExpense('food', 15000, 'Groceries 1'));
      usage = calculateBudgetUsage(monthlyBudget, expenseStream);
      expect(usage.spent).toBe(150);
      expect(usage.percentage).toBe(30);
      expect(usage.thresholdState).toBe('under');

      // Step 3: Add dining out ($180.00 -> Total $330.00, 66% spent)
      expenseStream.push(createSimulatedExpense('food', 18000, 'Dining out'));
      usage = calculateBudgetUsage(monthlyBudget, expenseStream);
      expect(usage.spent).toBe(330);
      expect(usage.percentage).toBe(66);
      expect(usage.thresholdState).toBe('under');

      // Step 4: Add supermarket shopping ($85.00 -> Total $415.00, 83% spent -> TRIGGER TIER 2 WARNING)
      expenseStream.push(createSimulatedExpense('food', 8500, 'Supermarket trip'));
      usage = calculateBudgetUsage(monthlyBudget, expenseStream);
      expect(usage.spent).toBe(415);
      expect(usage.percentage).toBe(83);
      expect(usage.thresholdState).toBe('warning');
      expect(usage.isNearLimit).toBe(true);
      expect(usage.isExceeded).toBe(false);
      expect(usage.remaining).toBe(85);

      // Step 5: Add weekend BBQ party ($110.00 -> Total $525.00, 105% spent -> TRIGGER TIER 3 EXCEEDED)
      expenseStream.push(createSimulatedExpense('food', 11000, 'BBQ Supplies'));
      usage = calculateBudgetUsage(monthlyBudget, expenseStream);
      expect(usage.spent).toBe(525);
      expect(usage.percentage).toBe(105);
      expect(usage.thresholdState).toBe('exceeded');
      expect(usage.isNearLimit).toBe(false);
      expect(usage.isExceeded).toBe(true);
      expect(usage.remaining).toBe(-25);
      expect(usage.remainingInCents).toBe(-2500);

      // Verify final exceeded state in UI
      const { getByTestId, getByText } = render(<CategoryBudgetCard usage={usage} />);
      expect(getByText('Exceeded by $25.00')).toBeTruthy();
      expect(getByTestId('category-budget-card-spent')).toHaveTextContent('$525.00');
      expect(getByTestId('category-budget-card-remaining')).toHaveTextContent('-$25.00');
    });
  });

  // =========================================================================
  // 6. Full Screen Integration Simulation (BudgetsScreen)
  // =========================================================================
  describe('6. Budgets Screen Integration Simulation', () => {
    it('renders complete simulated dashboard with all 3 tier badges and interactive navigation', () => {
      const simulatedUsages: BudgetUsage[] = [
        {
          budgetId: '2026-08_food',
          category: 'food',
          month: '2026-08',
          limitInCents: 50000,
          limit: 500,
          spentInCents: 20000,
          spent: 200,
          remainingInCents: 30000,
          remaining: 300,
          percentage: 40,
          thresholdState: 'under',
          isExceeded: false,
          isNearLimit: false,
        },
        {
          budgetId: '2026-08_transport',
          category: 'transport',
          month: '2026-08',
          limitInCents: 30000,
          limit: 300,
          spentInCents: 27000,
          spent: 270,
          remainingInCents: 3000,
          remaining: 30,
          percentage: 90,
          thresholdState: 'warning',
          isExceeded: false,
          isNearLimit: true,
        },
        {
          budgetId: '2026-08_entertainment',
          category: 'entertainment',
          month: '2026-08',
          limitInCents: 20000,
          limit: 200,
          spentInCents: 25000,
          spent: 250,
          remainingInCents: -5000,
          remaining: -50,
          percentage: 125,
          thresholdState: 'exceeded',
          isExceeded: true,
          isNearLimit: false,
        },
      ];

      const simulatedSummary: BudgetSummary = {
        totalLimitInCents: 100000,
        totalLimit: 1000,
        totalSpentInCents: 72000,
        totalSpent: 720,
        totalRemainingInCents: 28000,
        totalRemaining: 280,
        percentage: 72,
        thresholdState: 'under',
      };

      const setActiveMonthMock = jest.fn();
      const setBudgetMock = jest.fn();
      const deleteBudgetMock = jest.fn();

      const mockContext: BudgetContextType = {
        activeMonth: '2026-08',
        budgets: [],
        budgetUsages: simulatedUsages,
        summary: simulatedSummary,
        isLoading: false,
        setActiveMonth: setActiveMonthMock,
        setBudget: setBudgetMock,
        deleteBudget: deleteBudgetMock,
        refreshBudgets: jest.fn(),
      };

      const { getByTestId, getByText, getAllByTestId } = render(
        <CategoryContext.Provider value={defaultCategoryContext}>
          <BudgetContext.Provider value={mockContext}>
            <BudgetsScreen />
          </BudgetContext.Provider>
        </CategoryContext.Provider>
      );

      // Verify Header & Overview Summary Card
      expect(getByTestId('budgets-screen')).toBeTruthy();
      expect(getByText('Monthly Budgets')).toBeTruthy();
      expect(getByTestId('budget-summary-card')).toBeTruthy();
      expect(getByTestId('budget-summary-card-spent')).toHaveTextContent('$720.00');
      expect(getByTestId('budget-summary-card-limit')).toHaveTextContent('$1,000.00');
      expect(getByTestId('budget-summary-card-remaining')).toHaveTextContent('$280.00');

      // Verify all 3 Category Budget Cards are rendered with distinct threshold badges
      const cards = getAllByTestId('category-budget-card');
      expect(cards.length).toBe(3);

      expect(getByText('On Track')).toBeTruthy(); // Under Tier
      expect(getByText('Near Limit (80%+)')).toBeTruthy(); // Near Limit Tier
      expect(getByText('Exceeded by $50.00')).toBeTruthy(); // Exceeded Tier

      // Verify Month Navigation interactions
      fireEvent.press(getByTestId('prev-month-btn'));
      expect(setActiveMonthMock).toHaveBeenCalledWith('2026-07');

      fireEvent.press(getByTestId('next-month-btn'));
      expect(setActiveMonthMock).toHaveBeenCalledWith('2026-09');
    });
  });
});
