import React from 'react';
import { render, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import AppDashboardScreen from '../../app/(app)/index';
import { DashboardProvider } from '../../src/features/dashboard/context/DashboardProvider';
import { CategoryContext } from '../../src/features/categories/context/CategoryContext';
import { BudgetContext } from '../../src/features/budgets/context/BudgetContext';
import { DashboardService } from '../../src/features/dashboard/services/dashboard.service';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useExpenses } from '../../src/features/expenses/hooks/useExpenses';
import {
  MonthSummary,
  MonthlyTrend,
  CategoryBreakdown,
} from '../../src/features/dashboard/types/dashboard.types';
import { Expense } from '../../src/features/expenses/types/expense.types';

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
  },
}));

describe('Dashboard Screen Integration (app/(app)/index.tsx)', () => {
  const mockUser = {
    uid: 'dash_user_999',
    email: 'alex@example.com',
    displayName: 'Alex Rivers',
  };

  const mockSummary: MonthSummary = {
    month: '2026-08',
    totalIncomeInCents: 450000,
    totalIncome: 4500,
    currentMonthIncomeInCents: 450000,
    currentMonthIncome: 4500,
    previousMonthRemainingInCents: 0,
    previousMonthRemaining: 0,
    totalExpensesInCents: 125000,
    totalExpenses: 1250,
    totalSavingsInCents: 50000,
    totalSavings: 500,
    remainingInCents: 275000,
    remaining: 2750,
    loansTakenIncomeInCents: 0,
    loansTakenIncome: 0,
    expenseCount: 4,
  };

  const mockBreakdowns: CategoryBreakdown[] = [
    { category: 'Food', totalInCents: 50000, total: 500, count: 2, percentage: 40, color: '#f43f5e' },
    { category: 'Transport', totalInCents: 31250, total: 312.5, count: 1, percentage: 25, color: '#6366f1' },
    { category: 'Entertainment', totalInCents: 25000, total: 250, count: 1, percentage: 20, color: '#10b981' },
    { category: 'Utilities', totalInCents: 18750, total: 187.5, count: 1, percentage: 15, color: '#f59e0b' },
  ];

  const mockTrends: MonthlyTrend[] = [
    { month: '2026-03', totalExpensesInCents: 110000, totalExpenses: 1100, totalSavingsInCents: 40000, totalSavings: 400 },
    { month: '2026-04', totalExpensesInCents: 115000, totalExpenses: 1150, totalSavingsInCents: 45000, totalSavings: 450 },
    { month: '2026-05', totalExpensesInCents: 120000, totalExpenses: 1200, totalSavingsInCents: 50000, totalSavings: 500 },
    { month: '2026-06', totalExpensesInCents: 105000, totalExpenses: 1050, totalSavingsInCents: 60000, totalSavings: 600 },
    { month: '2026-07', totalExpensesInCents: 130000, totalExpenses: 1300, totalSavingsInCents: 35000, totalSavings: 350 },
    { month: '2026-08', totalExpensesInCents: 125000, totalExpenses: 1250, totalSavingsInCents: 50000, totalSavings: 500 },
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'exp_1',
      title: 'Groceries Store',
      description: 'Weekly food',
      amount: 300,
      amountInCents: 30000,
      category: 'Food',
      date: '2026-08-05T10:00:00.000Z',
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: '2026-08-05T10:00:00.000Z',
      updatedAt: '2026-08-05T10:00:00.000Z',
    },
    {
      id: 'exp_2',
      title: 'Monthly Metro Pass',
      description: 'Commute',
      amount: 312.5,
      amountInCents: 31250,
      category: 'Transport',
      date: '2026-08-08T09:00:00.000Z',
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: '2026-08-08T09:00:00.000Z',
      updatedAt: '2026-08-08T09:00:00.000Z',
    },
  ];

  const mockCategoryContext = {
    categories: [
      { id: 'cat-1', value: 'Food', label: 'Food', icon: '🍔', isCustom: false },
      { id: 'cat-2', value: 'Transport', label: 'Transport', icon: '🚗', isCustom: false },
      { id: 'cat-3', value: 'Entertainment', label: 'Entertainment', icon: '🎬', isCustom: false },
      { id: 'cat-4', value: 'Utilities', label: 'Utilities', icon: '💡', isCustom: false },
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
      totalLimitInCents: 200000,
      totalLimit: 2000,
      totalSpentInCents: 125000,
      totalSpent: 1250,
      totalRemainingInCents: 75000,
      totalRemaining: 750,
      percentage: 62.5,
      thresholdState: 'warning' as const,
    },
    isLoading: false,
    setActiveMonth: jest.fn(),
    setBudget: jest.fn(),
    deleteBudget: jest.fn(),
    refreshBudgets: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: { displayName: 'Alex Rivers' },
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    (useExpenses as jest.Mock).mockReturnValue({
      expenses: mockExpenses,
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

    (DashboardService.getMonthSummary as jest.Mock).mockResolvedValue(mockSummary);
    (DashboardService.getMonthlyTrend as jest.Mock).mockResolvedValue(mockTrends);
    (DashboardService.getCategoryBreakdown as jest.Mock).mockResolvedValue(mockBreakdowns);
  });

  const renderDashboardScreen = (initialMonth = '2026-08') => {
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

  it('renders welcome header, user account details, and sign out button', async () => {
    const { getByText, getByTestId } = renderDashboardScreen();

    await waitFor(() => {
      expect(getByText('Welcome, Alex Rivers!')).toBeTruthy();
    });

    expect(getByTestId('app-brand-badge')).toBeTruthy();
    expect(getByTestId('logout-button')).toBeTruthy();
    expect(getByTestId('user-email-text').props.children).toBe('alex@example.com');
    expect(getByTestId('user-name-text').props.children).toBe('Alex Rivers');
    expect(getByTestId('user-uid-text').props.children).toBe('dash_user_999');
  });

  it('renders MonthNavigator with localized active month string', async () => {
    const { getByTestId, getByText } = renderDashboardScreen();

    await waitFor(() => {
      expect(getByTestId('month-navigator')).toBeTruthy();
    });

    expect(getByText('August 2026')).toBeTruthy();
  });

  it('renders all 4 summary metric cards with formatted currency strings', async () => {
    const { getByTestId } = renderDashboardScreen();

    await waitFor(() => {
      expect(getByTestId('summary-cards-grid')).toBeTruthy();
    });

    await waitFor(() => {
      const incomeCard = getByTestId('summary-card-income');
      expect(within(incomeCard).getByText('$4,500.00')).toBeTruthy();
    });

    const expensesCard = getByTestId('summary-card-expenses');
    expect(within(expensesCard).getByText('$1,250.00')).toBeTruthy();

    const savingsCard = getByTestId('summary-card-savings');
    expect(within(savingsCard).getByText('$500.00')).toBeTruthy();

    const remainingCard = getByTestId('summary-card-remaining');
    expect(within(remainingCard).getByText('$2,750.00')).toBeTruthy();
  });

  it('renders CategoryDonutChart and MonthlyTrendBarChart', async () => {
    const { getByTestId, getByText } = renderDashboardScreen();

    await waitFor(() => {
      expect(getByText('Spending by Category')).toBeTruthy();
    });

    expect(getByTestId('category-donut-chart')).toBeTruthy();
    expect(getByTestId('monthly-trend-bar-chart')).toBeTruthy();
    expect(getByText('Expenses vs Savings')).toBeTruthy();
  });

  it('renders quick action shortcuts and handles navigation', async () => {
    const { getByTestId } = renderDashboardScreen();

    await waitFor(() => {
      expect(getByTestId('action-shortcuts')).toBeTruthy();
    });

    // Tap + Add Expense
    fireEvent.press(getByTestId('quick-add-expense-btn'));
    expect(mockPush).toHaveBeenCalledWith('/expenses/new');

    // Tap Budgets
    fireEvent.press(getByTestId('nav-budgets-btn'));
    expect(mockPush).toHaveBeenCalledWith('/budgets');

    // Tap Categories
    fireEvent.press(getByTestId('nav-categories-btn'));
    expect(mockPush).toHaveBeenCalledWith('/categories');
  });

  it('switching month updates MonthNavigator and calls DashboardService with new month', async () => {
    const { getByTestId, getByText } = renderDashboardScreen();

    await waitFor(() => {
      expect(getByText('August 2026')).toBeTruthy();
    });

    const prevBtn = getByTestId('month-prev-btn');
    await act(async () => {
      fireEvent.press(prevBtn);
    });

    await waitFor(() => {
      expect(getByText('July 2026')).toBeTruthy();
    });

    expect(DashboardService.getMonthSummary).toHaveBeenCalledWith('dash_user_999', '2026-07');
    expect(DashboardService.getMonthlyTrend).toHaveBeenCalledWith('dash_user_999', 6, '2026-07');
    expect(DashboardService.getCategoryBreakdown).toHaveBeenCalledWith('dash_user_999', '2026-07');
  });

  it('renders recent transactions list and search/filtering controls', async () => {
    const { getByTestId, getByText } = renderDashboardScreen();

    await waitFor(() => {
      expect(getByTestId('expense-list-header')).toBeTruthy();
      expect(getByTestId('recent-expenses-list')).toBeTruthy();
    });

    expect(getByText('Groceries Store')).toBeTruthy();
    expect(getByText('Monthly Metro Pass')).toBeTruthy();
  });
});
