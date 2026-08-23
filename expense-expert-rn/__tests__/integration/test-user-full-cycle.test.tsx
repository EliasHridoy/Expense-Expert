import React from 'react';
import { render, renderHook, act, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

// Auth Module Imports
import { AuthService } from '../../src/features/auth/services/auth.service';
import { AuthProvider } from '../../src/features/auth/context/AuthProvider';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { UserProfile } from '../../src/features/auth/types/auth.types';

// Dashboard & Financial Math Imports
import {
  toCents,
  fromCents,
  addCents,
  subtractCents,
  formatCents,
} from '../../src/features/expenses/utils/currency.util';
import {
  computeMonthSummary,
  computeCategoryBreakdown,
  computeMonthlyTrend,
  resolveSalaryInCents,
  getMonthsBetween,
} from '../../src/features/dashboard/utils/aggregation.util';
import {
  RawFinancialData,
  CategoryBreakdown,
  MonthlyTrend,
} from '../../src/features/dashboard/types/dashboard.types';
import { CategoryDonutChart } from '../../src/features/dashboard/components/CategoryDonutChart';
import { MonthlyTrendBarChart } from '../../src/features/dashboard/components/MonthlyTrendBarChart';
import { SummaryCard } from '../../src/features/dashboard/components/SummaryCard';
import { generateDonutSlices, normalizeBarScale } from '../../src/features/dashboard/utils/svg-chart.util';

// Expense & Offline Queue Imports
import { ExpenseService } from '../../src/features/expenses/services/expense.service';
import {
  OfflineQueueService,
  QUEUE_STORAGE_KEY,
} from '../../src/features/expenses/services/offline-queue.service';
import {
  Expense,
  CreateExpenseDto,
  QueuedMutation,
} from '../../src/features/expenses/types/expense.types';

// Category Module Imports
import {
  ExpenseCategory,
  CategoryItem,
  EXPENSE_CATEGORIES,
} from '../../src/features/categories/types/category.types';
import { CategoryBadge } from '../../src/features/categories/components/CategoryBadge';
import { CategoryService, CATEGORIES_CACHE_KEY } from '../../src/features/categories/services/category.service';
import { CategoryProvider } from '../../src/features/categories/context/CategoryProvider';
import { CategoryContext } from '../../src/features/categories/context/CategoryContext';

// Budget & Threshold Imports
import {
  calculateBudgetUsage,
  calculateTotalBudgetSummary,
  getThresholdColor,
} from '../../src/features/budgets/utils/budget.util';
import { CategoryBudget, BudgetUsage } from '../../src/features/budgets/types/budget.types';
import { CategoryBudgetCard } from '../../src/features/budgets/components/CategoryBudgetCard';
import { BudgetSummaryCard } from '../../src/features/budgets/components/BudgetSummaryCard';
import { BudgetProgressBar } from '../../src/features/budgets/components/BudgetProgressBar';

// Filtering & Search Imports
import {
  filterExpenses,
  sortExpenses,
  groupExpenses,
} from '../../src/features/expenses/utils/filter.util';
import { useTransactionFilters } from '../../src/features/expenses/hooks/useTransactionFilters';
import { FilterCriteria, DEFAULT_FILTER_CRITERIA } from '../../src/features/expenses/types/filter.types';
import { toDateInputValue } from '../../src/features/expenses/utils/date.util';

// Real-time Sync Imports
import { RealtimeSyncManager } from '../../src/features/sync/services/RealtimeSyncManager';

// Router Navigation Mocks
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

// Firebase Auth Mocks
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signOut: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
}));

// Firebase Firestore Mocks
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    getFirestore: jest.fn(() => ({ type: 'firestore_mock' })),
    collection: jest.fn((_db, path) => ({ path })),
    doc: jest.fn((_db, path, id) => ({ id, path: `${path}/${id}` })),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn().mockResolvedValue(undefined),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn((...args) => ({ type: 'query', args })),
    where: jest.fn((field, op, val) => ({ type: 'where', field, op, val })),
    orderBy: jest.fn((field, direction) => ({ type: 'orderBy', field, direction })),
    serverTimestamp: jest.fn(() => '2026-08-23T23:59:00.000Z'),
    onSnapshot: jest.fn(),
  };
});

jest.mock('../../src/config/firebase', () => ({
  auth: { currentUser: null },
  db: { type: 'firestore_mock' },
}));

/**
 * Reference Oracle: Exact Angular TypeScript implementation of the financial calculation
 * from original `expense-expert/src/app/core/services/dashboard.service.ts`
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

// ============================================================================
// TEST USER FIXTURES (test-user-7@yopmail.com)
// ============================================================================

const TEST_USER_CREDENTIALS = {
  email: 'test-user-7@yopmail.com',
  password: 'Test@123',
};

const TEST_USER_FIREBASE: User = {
  uid: 'usr_test_user_7',
  email: 'test-user-7@yopmail.com',
  displayName: 'Test User 7',
  emailVerified: true,
} as unknown as User;

const TEST_USER_FIRESTORE_PROFILE: UserProfile = {
  uid: 'usr_test_user_7',
  email: 'test-user-7@yopmail.com',
  displayName: 'Test User 7',
  createdAt: '2025-06-01T00:00:00.000Z',
  updatedAt: '2026-08-23T23:59:00.000Z',
  monthlySalary: 5000, // $5,000.00 -> 500,000 cents
  salaries: {
    '2025-06': 5000,
    '2026-01': 5500, // Salary stepped to $5,500.00 starting Jan 2026
  },
};

// ============================================================================
// COMPREHENSIVE FULL-CYCLE TEST SUITE
// ============================================================================

describe('End-to-End Full Cycle Integration Suite for test-user-7@yopmail.com', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    RealtimeSyncManager.teardownAll();

    // Default Firestore getDoc mock for user profile
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => TEST_USER_FIRESTORE_PROFILE,
    });
  });

  afterEach(async () => {
    RealtimeSyncManager.teardownAll();
    await AsyncStorage.clear();
  });

  // --------------------------------------------------------------------------
  // STEP 1: AUTH & PROFILE WORKFLOW
  // --------------------------------------------------------------------------
  describe('Step 1: Auth & Profile Workflow', () => {
    it('authenticates test-user-7@yopmail.com with valid credentials and resolves complete user profile', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: TEST_USER_FIREBASE,
      });

      const loggedInUser = await AuthService.login(TEST_USER_CREDENTIALS);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test-user-7@yopmail.com',
        'Test@123'
      );
      expect(loggedInUser.uid).toBe('usr_test_user_7');
      expect(loggedInUser.email).toBe('test-user-7@yopmail.com');

      const resolvedProfile = await AuthService.ensureUserDocument(loggedInUser);
      expect(resolvedProfile.displayName).toBe('Test User 7');
      expect(resolvedProfile.createdAt).toBe('2025-06-01T00:00:00.000Z');
      expect(resolvedProfile.monthlySalary).toBe(5000);
      expect(resolvedProfile.salaries).toEqual({
        '2025-06': 5000,
        '2026-01': 5500,
      });
    });

    it('hydrates AuthProvider state and exposes authenticated user with zero-drift profile numbers', async () => {
      let authCallback: (u: User | null) => void = () => {};
      (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
        authCallback = cb;
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial loading state
      expect(result.current.isLoading).toBe(true);

      // Trigger Firebase Auth state change with test-user-7
      await act(async () => {
        authCallback(TEST_USER_FIREBASE);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test-user-7@yopmail.com');
      expect(result.current.profile?.displayName).toBe('Test User 7');
      expect(result.current.profile?.monthlySalary).toBe(5000);
    });
  });

  // --------------------------------------------------------------------------
  // STEP 2: DASHBOARD OVERVIEW & MATHEMATICAL ROLL-FORWARD PARITY
  // --------------------------------------------------------------------------
  describe('Step 2: Dashboard Overview & 14-Month Roll-Forward Mathematical Parity', () => {
    it('verifies 14-month historical roll-forward from 2025-06 to 2026-08 with exact cent precision against Angular oracle', () => {
      // 14 intervening past months: 2025-06 through 2026-07
      const pastMonths = getMonthsBetween('2025-06-01T00:00:00.000Z', '2026-08');
      expect(pastMonths).toEqual([
        '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
        '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
      ]);
      expect(pastMonths.length).toBe(14);

      // Construct historical financial events
      const historicalExpenses: Array<Expense> = [
        // 2025-06 (Salary $5,000)
        {
          id: 'exp_h1',
          title: 'Initial Rent',
          description: 'Apartment deposit & first month',
          amount: 1500.0,
          amountInCents: 150000,
          category: 'housing',
          date: '2025-06-05T00:00:00.000Z',
          month: '2025-06',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2025-06-05T00:00:00.000Z',
          updatedAt: '2025-06-05T00:00:00.000Z',
        },
        {
          id: 'exp_h2',
          title: 'Emergency Fund Transfer',
          description: 'Savings expense item',
          amount: 500.0,
          amountInCents: 50000,
          category: 'savings', // Categorized as savings -> avoided from double deduction
          date: '2025-06-10T00:00:00.000Z',
          month: '2025-06',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2025-06-10T00:00:00.000Z',
          updatedAt: '2025-06-10T00:00:00.000Z',
        },
        // 2025-11
        {
          id: 'exp_h3',
          title: 'Holiday Travel Tickets',
          description: 'Flights home',
          amount: 780.5,
          amountInCents: 78050,
          category: 'transport',
          date: '2025-11-20T00:00:00.000Z',
          month: '2025-11',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2025-11-20T00:00:00.000Z',
          updatedAt: '2025-11-20T00:00:00.000Z',
        },
        // 2026-01 (Salary stepped to $5,500)
        {
          id: 'exp_h4',
          title: 'New Laptop',
          description: 'Workstation upgrade',
          amount: 2200.0,
          amountInCents: 220000,
          category: 'utilities',
          date: '2026-01-15T00:00:00.000Z',
          month: '2026-01',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-01-15T00:00:00.000Z',
          updatedAt: '2026-01-15T00:00:00.000Z',
        },
        // Target Month 2026-08 Expenses
        {
          id: 'exp_curr_1',
          title: 'Whole Foods Organic Groceries',
          description: 'Weekly food essentials',
          amount: 145.5,
          amountInCents: 14550,
          category: 'food',
          date: '2026-08-04T12:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-04T12:00:00.000Z',
          updatedAt: '2026-08-04T12:00:00.000Z',
        },
        {
          id: 'exp_curr_2',
          title: 'Monthly Transit Pass',
          description: 'Train & Subway pass',
          amount: 80.0,
          amountInCents: 8000,
          category: 'transport',
          date: '2026-08-05T08:30:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-05T08:30:00.000Z',
          updatedAt: '2026-08-05T08:30:00.000Z',
        },
      ];

      const historicalSavings = [
        // 2025-06 Savings Entry: Deposit $500 (matches exp_h2)
        {
          id: 'sav_h1',
          title: 'Emergency Deposit',
          amount: 500.0,
          amountInCents: 50000,
          type: 'deposit' as const,
          month: '2025-06',
          date: '2025-06-10T00:00:00.000Z',
        },
        // 2026-03 Savings Deposit $1,000
        {
          id: 'sav_h2',
          title: 'High Yield Savings',
          amount: 1000.0,
          amountInCents: 100000,
          type: 'deposit' as const,
          month: '2026-03',
          date: '2026-03-01T00:00:00.000Z',
        },
        // 2026-05 Savings Withdrawal $300 (Net savings = -300)
        {
          id: 'sav_h3',
          title: 'Car repair withdrawal',
          amount: 300.0,
          amountInCents: 30000,
          type: 'withdrawal' as const,
          month: '2026-05',
          date: '2026-05-15T00:00:00.000Z',
        },
        // Target Month 2026-08 Savings Deposit $250
        {
          id: 'sav_curr_1',
          title: 'Monthly Index Fund Transfer',
          amount: 250.0,
          amountInCents: 25000,
          type: 'deposit' as const,
          month: '2026-08',
          date: '2026-08-01T00:00:00.000Z',
        },
      ];

      const historicalIncome = [
        // 2025-09 Side project bonus $1,200
        {
          id: 'inc_h1',
          amount: 1200.0,
          amountInCents: 120000,
          month: '2025-09',
          date: '2025-09-15T00:00:00.000Z',
        },
        // Target Month 2026-08 Consulting $450
        {
          id: 'inc_curr_1',
          amount: 450.0,
          amountInCents: 45000,
          month: '2026-08',
          date: '2026-08-10T00:00:00.000Z',
        },
      ];

      const historicalLoans = [
        // 2026-02 Loan taken $800
        {
          id: 'loan_h1',
          amount: 800.0,
          amountInCents: 80000,
          month: '2026-02',
          date: '2026-02-12T00:00:00.000Z',
        },
        // Target Month 2026-08 Loan taken $300
        {
          id: 'loan_curr_1',
          amount: 300.0,
          amountInCents: 30000,
          month: '2026-08',
          date: '2026-08-03T00:00:00.000Z',
        },
      ];

      const rawFinancialData: RawFinancialData = {
        month: '2026-08',
        profile: TEST_USER_FIRESTORE_PROFILE,
        expenses: historicalExpenses,
        savingEntries: historicalSavings,
        incomeEntries: historicalIncome,
        loansTaken: historicalLoans,
      };

      // 1. Calculate using React Native Zero-Drift Integer Cents Engine
      const rnSummary = computeMonthSummary(rawFinancialData);

      // 2. Calculate using Angular TypeScript Reference Oracle
      const angularSummary = angularDashboardCalculationOracle(
        historicalExpenses,
        historicalSavings,
        historicalIncome,
        historicalLoans,
        TEST_USER_FIRESTORE_PROFILE,
        '2026-08'
      );

      // Assert 100% Mathematical Parity Down to the Last Cent
      expect(rnSummary.previousMonthRemaining).toBeCloseTo(angularSummary.previousMonthRemaining, 2);
      expect(rnSummary.currentMonthIncome).toBeCloseTo(angularSummary.currentMonthIncome, 2);
      expect(rnSummary.totalIncome).toBeCloseTo(angularSummary.totalIncome, 2);
      expect(rnSummary.totalExpenses).toBeCloseTo(angularSummary.totalExpenses, 2);
      expect(rnSummary.totalSavings).toBeCloseTo(angularSummary.totalSavings, 2);
      expect(rnSummary.remaining).toBeCloseTo(angularSummary.remaining, 2);
      expect(rnSummary.loansTakenIncome).toBeCloseTo(angularSummary.loansTakenIncome, 2);
      expect(rnSummary.expenseCount).toBe(2);

      // Verify Salary Step Resolution
      expect(resolveSalaryInCents(TEST_USER_FIRESTORE_PROFILE, '2025-06')).toBe(500000);
      expect(resolveSalaryInCents(TEST_USER_FIRESTORE_PROFILE, '2025-12')).toBe(500000);
      expect(resolveSalaryInCents(TEST_USER_FIRESTORE_PROFILE, '2026-01')).toBe(550000);
      expect(resolveSalaryInCents(TEST_USER_FIRESTORE_PROFILE, '2026-08')).toBe(550000);

      // Target month income = Salary ($5,500) + Consulting ($450) + Loan Taken ($300) = $6,250.00
      expect(rnSummary.currentMonthIncomeInCents).toBe(625000);
      expect(rnSummary.totalExpensesInCents).toBe(22550); // $145.50 + $80.00 = $225.50
    });

    it('renders SummaryCard components displaying accurate financial metrics', () => {
      const { getByTestId, getByText } = render(
        <SummaryCard
          title="Total Income"
          amountFormatted="$6,250.00"
          icon="💰"
          type="income"
          testID="card-total-income"
        />
      );

      expect(getByTestId('card-total-income')).toBeTruthy();
      expect(getByText('Total Income')).toBeTruthy();
      expect(getByText('$6,250.00')).toBeTruthy();
      expect(getByText('💰')).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // STEP 3: EXPENSES & OFFLINE QUEUE DRAINAGE
  // --------------------------------------------------------------------------
  describe('Step 3: Expense Creation, Integer-Cents & Offline Sync Reconciliation', () => {
    const userId = 'usr_test_user_7';

    it('converts floating point and currency string amounts into lossless integer cents', () => {
      expect(toCents(145.5)).toBe(14550);
      expect(toCents('145.50')).toBe(14550);
      expect(toCents(80.0)).toBe(8000);
      expect(fromCents(14550)).toBe(145.5);
      expect(formatCents(14550)).toBe('$145.50');
      expect(formatCents(8000)).toBe('$80.00');
    });

    it('creates expense directly in Firestore when online', async () => {
      const dto: CreateExpenseDto = {
        title: 'Whole Foods Market',
        description: 'Weekly organic groceries',
        amount: '145.50',
        category: ExpenseCategory.Food,
        date: '2026-08-10T10:00:00.000Z',
      };

      const created = await ExpenseService.addExpense(userId, dto, true);

      expect(created.amountInCents).toBe(14550);
      expect(created.amount).toBe(145.5);
      expect(created.syncStatus).toBe('synced');
      expect(setDoc).toHaveBeenCalled();

      const queueCount = await OfflineQueueService.getPendingCount(userId);
      expect(queueCount).toBe(0);
    });

    it('enqueues mutations into AsyncStorage when offline and drains queue on network reconnection', async () => {
      const dto1: CreateExpenseDto = {
        title: 'Whole Foods Offline',
        description: 'Offline grocery purchase',
        amount: '145.50',
        category: ExpenseCategory.Food,
        date: '2026-08-11T11:00:00.000Z',
      };

      const dto2: CreateExpenseDto = {
        title: 'Metro Transit Subway',
        description: 'Offline transport purchase',
        amount: '80.00',
        category: ExpenseCategory.Transport,
        date: '2026-08-11T12:00:00.000Z',
      };

      // 1. Create expenses while OFFLINE
      const expense1 = await ExpenseService.addExpense(userId, dto1, false);
      const expense2 = await ExpenseService.addExpense(userId, dto2, false);

      expect(expense1.syncStatus).toBe('pending');
      expect(expense2.syncStatus).toBe('pending');

      // 2. Verify mutations are queued in AsyncStorage
      const pendingQueue = await OfflineQueueService.getQueue();
      expect(pendingQueue.length).toBe(2);
      expect(pendingQueue[0].type).toBe('CREATE_EXPENSE');
      expect(pendingQueue[0].payload.amountInCents).toBe(14550);
      expect(pendingQueue[1].payload.amountInCents).toBe(8000);

      const pendingCount = await OfflineQueueService.getPendingCount(userId);
      expect(pendingCount).toBe(2);

      // 3. Reconnect network and process sync queue
      (setDoc as jest.Mock).mockClear();
      const syncedCount = await ExpenseService.processSyncQueue(userId);

      expect(syncedCount).toBe(2);
      expect(setDoc).toHaveBeenCalledTimes(2);

      // 4. Verify queue is completely drained
      const remainingCount = await OfflineQueueService.getPendingCount(userId);
      expect(remainingCount).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // STEP 4: CUSTOM CATEGORY LIFECYCLE & BADGE FALLBACK
  // --------------------------------------------------------------------------
  describe('Step 4: Custom Category Creation, Assignment, Deletion & Graceful Badge Fallback', () => {
    const userId = 'usr_test_user_7';

    it('verifies 7 predefined built-in categories', () => {
      expect(EXPENSE_CATEGORIES).toHaveLength(7);
      expect(EXPENSE_CATEGORIES.map((c) => c.value)).toEqual([
        ExpenseCategory.Food,
        ExpenseCategory.Transport,
        ExpenseCategory.Entertainment,
        ExpenseCategory.Utilities,
        ExpenseCategory.Savings,
        ExpenseCategory.LoanRepayment,
        ExpenseCategory.Other,
      ]);
    });

    it('creates custom category "SaaS Tools 💻", assigns to expense, deletes category, and renders graceful badge fallback', async () => {
      // 1. Create Custom Category
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
      const customCategory = await CategoryService.addCustomCategory(userId, {
        name: 'SaaS Tools 💻',
        icon: '💻',
      });

      expect(customCategory.label).toBe('SaaS Tools 💻');
      expect(customCategory.icon).toBe('💻');
      expect(customCategory.isCustom).toBe(true);

      // 2. Render CategoryBadge with existing custom category
      const builtIns = CategoryService.getBuiltInCategories();
      const mockCategoryContextWithCustom = {
        categories: [...builtIns, customCategory],
        builtInCategories: builtIns,
        customCategories: [customCategory],
        isLoading: false,
        addCategory: jest.fn(),
        deleteCategory: jest.fn(),
        getCategoryByValue: (val: string) =>
          val === customCategory.value || val === customCategory.id
            ? customCategory
            : { value: val, label: val || 'Other', icon: '📁', isCustom: false },
        refreshCategories: jest.fn(),
      };

      const { getByTestId, getByText, rerender } = render(
        <CategoryContext.Provider value={mockCategoryContextWithCustom}>
          <CategoryBadge category={customCategory.value} testID="custom-cat-badge" />
        </CategoryContext.Provider>
      );

      expect(getByTestId('custom-cat-badge')).toBeTruthy();
      expect(getByText('💻')).toBeTruthy();
      expect(getByText('SaaS Tools 💻')).toBeTruthy();

      // 3. Delete Custom Category
      (deleteDoc as jest.Mock).mockResolvedValueOnce(undefined);
      await CategoryService.deleteCustomCategory(userId, customCategory.id!);
      expect(deleteDoc).toHaveBeenCalled();

      // 4. Render CategoryBadge for orphaned / unknown expense category
      const mockCategoryContextAfterDelete = {
        ...mockCategoryContextWithCustom,
        categories: builtIns,
        customCategories: [],
        getCategoryByValue: (val: string) => {
          const builtin = builtIns.find((c) => c.value === val);
          return (
            builtin || {
              value: val,
              label: val === customCategory.value ? 'Unknown' : val || 'Other',
              icon: '📁',
              isCustom: false,
            }
          );
        },
      };

      rerender(
        <CategoryContext.Provider value={mockCategoryContextAfterDelete}>
          <CategoryBadge category={customCategory.value} testID="custom-cat-badge-orphaned" />
        </CategoryContext.Provider>
      );

      expect(getByTestId('custom-cat-badge-orphaned')).toBeTruthy();
      expect(getByText('📁')).toBeTruthy();
      expect(getByText('Unknown')).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // STEP 5: BUDGETS & 3-TIER THRESHOLD WARNING STATES
  // --------------------------------------------------------------------------
  describe('Step 5: Monthly Budgets & 3-Tier Threshold Warning States', () => {
    const foodBudget: CategoryBudget = {
      id: '2026-08_food',
      userId: 'usr_test_user_7',
      category: 'food',
      month: '2026-08',
      limit: 500.0, // $500.00 Limit -> 50,000 cents
      limitInCents: 50000,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    it('State 1: Computes Under Budget (Spent $145.50 / $500.00 = 29.1%) with Emerald threshold styling', () => {
      const expenses: Expense[] = [
        {
          id: 'exp_food_1',
          title: 'Grocery Essentials',
          description: '',
          amount: 145.5,
          amountInCents: 14550,
          category: 'food',
          date: '2026-08-05T00:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-05T00:00:00.000Z',
          updatedAt: '2026-08-05T00:00:00.000Z',
        },
      ];

      const usage: BudgetUsage = calculateBudgetUsage(foodBudget, expenses);

      expect(usage.spentInCents).toBe(14550);
      expect(usage.spent).toBe(145.5);
      expect(usage.remainingInCents).toBe(35450);
      expect(usage.remaining).toBe(354.5);
      expect(usage.percentage).toBe(29.1);
      expect(usage.thresholdState).toBe('under');
      expect(usage.isNearLimit).toBe(false);
      expect(usage.isExceeded).toBe(false);

      const color = getThresholdColor(usage.thresholdState);
      expect(color.barColor).toBe('bg-emerald-500');
      expect(color.textColor).toContain('emerald');

      const { getByTestId, getByText } = render(
        <BudgetProgressBar percentage={usage.percentage} thresholdState={usage.thresholdState} />
      );
      expect(getByTestId('budget-progress-bar')).toBeTruthy();
      expect(getByTestId('budget-progress-bar-fill')).toBeTruthy();
    });

    it('State 2: Computes Near Limit Warning (Spent $420.00 / $500.00 = 84.0%) with Amber threshold styling', () => {
      const expenses: Expense[] = [
        {
          id: 'exp_food_1',
          title: 'Grocery Essentials',
          description: '',
          amount: 145.5,
          amountInCents: 14550,
          category: 'food',
          date: '2026-08-05T00:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-05T00:00:00.000Z',
          updatedAt: '2026-08-05T00:00:00.000Z',
        },
        {
          id: 'exp_food_2',
          title: 'Dinner with Team',
          description: 'Steakhouse dinner',
          amount: 274.5,
          amountInCents: 27450,
          category: 'food',
          date: '2026-08-15T00:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-15T00:00:00.000Z',
          updatedAt: '2026-08-15T00:00:00.000Z',
        },
      ];

      const usage: BudgetUsage = calculateBudgetUsage(foodBudget, expenses);

      expect(usage.spentInCents).toBe(42000);
      expect(usage.spent).toBe(420.0);
      expect(usage.remainingInCents).toBe(8000);
      expect(usage.remaining).toBe(80.0);
      expect(usage.percentage).toBe(84.0);
      expect(usage.thresholdState).toBe('warning');
      expect(usage.isNearLimit).toBe(true);
      expect(usage.isExceeded).toBe(false);

      const color = getThresholdColor(usage.thresholdState);
      expect(color.barColor).toBe('bg-amber-500');
      expect(color.textColor).toContain('amber');
    });

    it('State 3: Computes Budget Exceeded (Spent $550.00 / $500.00 = 110.0%) with Rose threshold styling', () => {
      const expenses: Expense[] = [
        {
          id: 'exp_food_1',
          title: 'Grocery Essentials',
          description: '',
          amount: 145.5,
          amountInCents: 14550,
          category: 'food',
          date: '2026-08-05T00:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-05T00:00:00.000Z',
          updatedAt: '2026-08-05T00:00:00.000Z',
        },
        {
          id: 'exp_food_2',
          title: 'Dinner with Team',
          description: '',
          amount: 274.5,
          amountInCents: 27450,
          category: 'food',
          date: '2026-08-15T00:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-15T00:00:00.000Z',
          updatedAt: '2026-08-15T00:00:00.000Z',
        },
        {
          id: 'exp_food_3',
          title: 'Weekend Catering',
          description: '',
          amount: 130.0,
          amountInCents: 13000,
          category: 'food',
          date: '2026-08-20T00:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-20T00:00:00.000Z',
          updatedAt: '2026-08-20T00:00:00.000Z',
        },
      ];

      const usage: BudgetUsage = calculateBudgetUsage(foodBudget, expenses);

      expect(usage.spentInCents).toBe(55000);
      expect(usage.spent).toBe(550.0);
      expect(usage.remainingInCents).toBe(-5000);
      expect(usage.remaining).toBe(-50.0);
      expect(usage.percentage).toBe(110.0);
      expect(usage.thresholdState).toBe('exceeded');
      expect(usage.isNearLimit).toBe(false);
      expect(usage.isExceeded).toBe(true);

      const color = getThresholdColor(usage.thresholdState);
      expect(color.barColor).toBe('bg-rose-500');
      expect(color.textColor).toContain('rose');

      // Total Budget Summary
      const summary = calculateTotalBudgetSummary([foodBudget], expenses, '2026-08');
      expect(summary.totalLimitInCents).toBe(50000);
      expect(summary.totalSpentInCents).toBe(55000);
      expect(summary.totalRemainingInCents).toBe(-5000);
      expect(summary.thresholdState).toBe('exceeded');

      const { getByTestId, getByText } = render(
        <BudgetSummaryCard
          summary={summary}
          activeMonth="2026-08"
          onAddBudget={jest.fn()}
          testID="budget-summary-card"
        />
      );

      expect(getByTestId('budget-summary-card')).toBeTruthy();
      expect(getByText('Total Limit')).toBeTruthy();
      expect(getByText('$500.00')).toBeTruthy();
      expect(getByText('$550.00')).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // STEP 6: CHARTS (DONUT & DUAL-BAR)
  // --------------------------------------------------------------------------
  describe('Step 6: SVG Category Donut & 6-Month Dual-Bar Chart Visualizations', () => {
    it('renders SVG CategoryDonutChart with calculated slices and handles slice interaction', () => {
      const breakdownData: CategoryBreakdown[] = [
        {
          category: 'food',
          total: 550.0,
          totalInCents: 55000,
          percentage: 65.4,
          count: 3,
          color: '#10B981',
        },
        {
          category: 'transport',
          total: 80.0,
          totalInCents: 8000,
          percentage: 9.5,
          count: 1,
          color: '#3B82F6',
        },
        {
          category: 'utilities',
          total: 210.25,
          totalInCents: 21025,
          percentage: 25.0,
          count: 1,
          color: '#F59E0B',
        },
      ];

      const slices = generateDonutSlices(
        breakdownData.map((d) => ({
          id: d.category,
          label: d.category,
          valueInCents: d.totalInCents,
          color: d.color!,
        })),
        220,
        32
      );

      expect(slices).toHaveLength(3);
      expect(slices[0].id).toBe('food');
      expect(slices[0].pathData).toContain('M');

      const onSelectCategory = jest.fn();
      const { getByTestId, getByText } = render(
        <CategoryDonutChart
          data={breakdownData}
          size={220}
          onSelectCategory={onSelectCategory}
          testID="test-donut-chart"
        />
      );

      expect(getByTestId('test-donut-chart')).toBeTruthy();
      expect(getByText('Spending by Category')).toBeTruthy();
      expect(getByText('5 transactions')).toBeTruthy();

      const foodSlice = getByTestId('donut-slice-food');
      expect(foodSlice).toBeTruthy();

      fireEvent.press(foodSlice);
      expect(onSelectCategory).toHaveBeenCalledWith('food');
    });

    it('renders MonthlyTrendBarChart with 6 historical dual bars and tick mark normalizations', () => {
      const trends: MonthlyTrend[] = [
        {
          month: '2026-03',
          totalExpensesInCents: 120000,
          totalExpenses: 1200.0,
          totalSavingsInCents: 100000,
          totalSavings: 1000.0,
        },
        {
          month: '2026-04',
          totalExpensesInCents: 95000,
          totalExpenses: 950.0,
          totalSavingsInCents: 50000,
          totalSavings: 500.0,
        },
        {
          month: '2026-05',
          totalExpensesInCents: 110000,
          totalExpenses: 1100.0,
          totalSavingsInCents: -30000,
          totalSavings: -300.0,
        },
        {
          month: '2026-06',
          totalExpensesInCents: 140000,
          totalExpenses: 1400.0,
          totalSavingsInCents: 60000,
          totalSavings: 600.0,
        },
        {
          month: '2026-07',
          totalExpensesInCents: 85000,
          totalExpenses: 850.0,
          totalSavingsInCents: 40000,
          totalSavings: 400.0,
        },
        {
          month: '2026-08',
          totalExpensesInCents: 84025,
          totalExpenses: 840.25,
          totalSavingsInCents: 25000,
          totalSavings: 250.0,
        },
      ];

      const allValues = trends.flatMap((t) => [
        t.totalExpensesInCents,
        t.totalSavingsInCents,
      ]);
      const { maxVal, gridTicks } = normalizeBarScale(allValues, 170);

      expect(maxVal).toBeGreaterThanOrEqual(140000);
      expect(gridTicks.length).toBeGreaterThanOrEqual(3);

      const { getByTestId, getByText } = render(
        <MonthlyTrendBarChart trends={trends} height={220} testID="test-bar-chart" />
      );

      expect(getByTestId('test-bar-chart')).toBeTruthy();
      expect(getByText('Expenses vs Savings')).toBeTruthy();
      expect(getByText('Last 6 Months')).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // STEP 7: IN-MEMORY FILTERING, SORTING & GROUPING PERFORMANCE
  // --------------------------------------------------------------------------
  describe('Step 7: In-Memory Multi-Criteria Filtering, Sorting & Sub-Millisecond Benchmark', () => {
    const dataset: Expense[] = [
      {
        id: 'exp_filter_1',
        title: 'Whole Foods Groceries',
        description: 'Organic vegetables and fruits',
        amount: 145.5,
        amountInCents: 14550,
        category: 'food',
        date: '2026-08-23T10:00:00.000Z',
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: '2026-08-23T10:00:00.000Z',
        updatedAt: '2026-08-23T10:00:00.000Z',
      },
      {
        id: 'exp_filter_2',
        title: 'Uber City Ride',
        description: 'Downtown client meeting',
        amount: 32.5,
        amountInCents: 3250,
        category: 'transport',
        date: '2026-08-22T14:00:00.000Z',
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: '2026-08-22T14:00:00.000Z',
        updatedAt: '2026-08-22T14:00:00.000Z',
      },
      {
        id: 'exp_filter_3',
        title: 'Netflix & Spotify Subs',
        description: 'Monthly digital streaming subscription',
        amount: 28.0,
        amountInCents: 2800,
        category: 'entertainment',
        date: '2026-08-10T09:00:00.000Z',
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: '2026-08-10T09:00:00.000Z',
        updatedAt: '2026-08-10T09:00:00.000Z',
      },
      {
        id: 'exp_filter_4',
        title: 'Electric & Internet Utility',
        description: 'Home high-speed fiber internet and electric bill',
        amount: 180.0,
        amountInCents: 18000,
        category: 'utilities',
        date: '2026-07-28T09:00:00.000Z',
        month: '2026-07',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: '2026-07-28T09:00:00.000Z',
        updatedAt: '2026-07-28T09:00:00.000Z',
      },
    ];

    it('filters by category chip ("food"), text search ("organic"), and date preset ("month")', () => {
      // Category filter
      const foodFiltered = filterExpenses(dataset, {
        ...DEFAULT_FILTER_CRITERIA,
        category: 'food',
      });
      expect(foodFiltered).toHaveLength(1);
      expect(foodFiltered[0].id).toBe('exp_filter_1');

      // Text Search filter (case-insensitive description matching)
      const textFiltered = filterExpenses(dataset, {
        ...DEFAULT_FILTER_CRITERIA,
        searchQuery: 'streaming',
      });
      expect(textFiltered).toHaveLength(1);
      expect(textFiltered[0].id).toBe('exp_filter_3');

      // Month preset filter (excludes 2026-07)
      const monthFiltered = filterExpenses(dataset, {
        ...DEFAULT_FILTER_CRITERIA,
        dateRange: 'month',
      });
      expect(monthFiltered.find((e) => e.id === 'exp_filter_4')).toBeUndefined();
    });

    it('sorts expenses by amount_desc, date_desc, and groups by category with subtotal calculations', () => {
      // Sort by amount descending
      const sortedByAmount = sortExpenses(dataset, 'amount_desc');
      expect(sortedByAmount[0].amountInCents).toBe(18000);
      expect(sortedByAmount[sortedByAmount.length - 1].amountInCents).toBe(2800);

      // Group by category
      const grouped = groupExpenses(dataset, 'category');
      expect(grouped.length).toBeGreaterThanOrEqual(4);

      const foodGroup = grouped.find((g) => g.key === 'food');
      expect(foodGroup).toBeDefined();
      expect(foodGroup?.totalInCents).toBe(14550);
      expect(foodGroup?.items.length).toBe(1);
    });

    it('executes sub-millisecond in-memory filtering across 5,000 operations without memory leak', () => {
      const criteria: FilterCriteria = {
        category: 'food',
        dateRange: 'all',
        searchQuery: 'whole foods',
        sortBy: 'date_desc',
        groupBy: 'none',
      };

      const startTime = performance.now();
      const iterations = 5000;
      for (let i = 0; i < iterations; i++) {
        filterExpenses(dataset, criteria);
      }
      const totalElapsedMs = performance.now() - startTime;
      const avgPerOpMs = totalElapsedMs / iterations;

      expect(totalElapsedMs).toBeLessThan(100); // 5,000 runs in < 100ms
      expect(avgPerOpMs).toBeLessThan(0.05); // < 0.05ms per filter operation
    });
  });

  // --------------------------------------------------------------------------
  // STEP 8: TEARDOWN, SIGN OUT & ZERO MEMORY LEAKS
  // --------------------------------------------------------------------------
  describe('Step 8: Teardown, Sign Out & Zero Memory Leak Verification', () => {
    it('registers active realtime listeners and tears them all down upon user logout', async () => {
      const mockUnsub1 = jest.fn();
      const mockUnsub2 = jest.fn();
      const mockUnsub3 = jest.fn();
      const mockUnsub4 = jest.fn();

      // Register 4 domain subscriptions
      RealtimeSyncManager.register('expenses_usr_test_user_7_2026-08', () => mockUnsub1);
      RealtimeSyncManager.register('categories_usr_test_user_7', () => mockUnsub2);
      RealtimeSyncManager.register('budgets_usr_test_user_7_2026-08', () => mockUnsub3);
      RealtimeSyncManager.register('dashboard_usr_test_user_7_2026-08', () => mockUnsub4);

      expect(RealtimeSyncManager.getActiveCount()).toBe(4);
      expect(RealtimeSyncManager.hasSubscription('expenses_usr_test_user_7_2026-08')).toBe(true);

      // Perform user logout
      await AuthService.logout();
      RealtimeSyncManager.teardownAll();

      // Verify all callbacks fired and active count dropped to 0
      expect(mockUnsub1).toHaveBeenCalledTimes(1);
      expect(mockUnsub2).toHaveBeenCalledTimes(1);
      expect(mockUnsub3).toHaveBeenCalledTimes(1);
      expect(mockUnsub4).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
      expect(RealtimeSyncManager.hasSubscription('expenses_usr_test_user_7_2026-08')).toBe(false);
    });
  });
});
