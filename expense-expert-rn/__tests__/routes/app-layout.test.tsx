import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AppLayoutGroup from '../../app/(app)/_layout';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useNetworkStatus } from '../../src/features/expenses/hooks/useNetworkStatus';
import { ExpenseService } from '../../src/features/expenses/services/expense.service';
import { CategoryService } from '../../src/features/categories/services/category.service';
import { BudgetService } from '../../src/features/budgets/services/budget.service';
import { DashboardService } from '../../src/features/dashboard/services/dashboard.service';
import { OfflineQueueService } from '../../src/features/expenses/services/offline-queue.service';
import { RealtimeSyncManager } from '../../src/features/sync/services/RealtimeSyncManager';
import { ExpenseCategory } from '../../src/features/expenses/types/category.types';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/features/expenses/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock('../../src/features/expenses/services/expense.service', () => ({
  ExpenseService: {
    getExpensesByMonth: jest.fn(),
    subscribeToExpenses: jest.fn(),
    addExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    processSyncQueue: jest.fn(),
  },
}));

jest.mock('../../src/features/categories/services/category.service', () => ({
  CategoryService: {
    getBuiltInCategories: jest.fn(),
    fetchCustomCategories: jest.fn(),
    subscribeToCustomCategories: jest.fn(),
    addCustomCategory: jest.fn(),
    deleteCustomCategory: jest.fn(),
  },
}));

jest.mock('../../src/features/budgets/services/budget.service', () => ({
  BudgetService: {
    getBudgetsByMonth: jest.fn(),
    subscribeToBudgets: jest.fn(),
    setCategoryBudget: jest.fn(),
    deleteCategoryBudget: jest.fn(),
  },
}));

jest.mock('../../src/features/dashboard/services/dashboard.service', () => ({
  DashboardService: {
    getMonthSummary: jest.fn(),
    getMonthlyTrend: jest.fn(),
    getCategoryBreakdown: jest.fn(),
  },
}));

jest.mock('../../src/features/savings/services/saving.service', () => ({
  SavingService: {
    getBankAccounts: jest.fn().mockResolvedValue([]),
    getGoals: jest.fn().mockResolvedValue([]),
    getEntries: jest.fn().mockResolvedValue([]),
    addBankAccount: jest.fn(),
    deleteBankAccount: jest.fn(),
    addGoal: jest.fn(),
    deleteGoal: jest.fn(),
    addEntry: jest.fn(),
  },
}));

jest.mock('../../src/features/drafts/services/draft.service', () => ({
  DraftService: {
    getDrafts: jest.fn().mockResolvedValue([]),
    getApplications: jest.fn().mockResolvedValue([]),
    createDraft: jest.fn(),
    deleteDraft: jest.fn(),
    applyDraftToMonth: jest.fn(),
    recordPayment: jest.fn(),
  },
}));

jest.mock('../../src/features/expenses/services/offline-queue.service', () => ({
  OfflineQueueService: {
    getPendingCount: jest.fn(),
    getQueue: jest.fn(),
  },
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const ScreenMock = ({ name }: { name: string }) => (
    <View testID={`screen-${name}`}>
      <Text>{name}</Text>
    </View>
  );
  const StackMock = ({ children }: { children: React.ReactNode }) => (
    <View testID="stack-navigator">{children}</View>
  );
  StackMock.Screen = ScreenMock;

  return {
    Stack: StackMock,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useSegments: () => ['(app)'],
    useLocalSearchParams: () => ({}),
  };
});

describe('AppLayoutGroup Integration (__tests__/routes/app-layout.test.tsx)', () => {
  const mockUser = {
    uid: 'layout-user-123',
    email: 'layout@example.com',
    displayName: 'Layout Tester',
  };

  const mockBuiltInCategories = [
    { value: ExpenseCategory.Food, label: 'Food & Dining', icon: '🍔', isCustom: false },
    { value: ExpenseCategory.Transport, label: 'Transportation', icon: '🚗', isCustom: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    RealtimeSyncManager.teardownAll();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: mockUser,
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn(),
    });

    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: true,
    });

    (CategoryService.getBuiltInCategories as jest.Mock).mockReturnValue(mockBuiltInCategories);
    (CategoryService.fetchCustomCategories as jest.Mock).mockResolvedValue([]);
    (CategoryService.subscribeToCustomCategories as jest.Mock).mockReturnValue(jest.fn());

    (OfflineQueueService.getPendingCount as jest.Mock).mockResolvedValue(0);
    (OfflineQueueService.getQueue as jest.Mock).mockResolvedValue([]);

    (ExpenseService.getExpensesByMonth as jest.Mock).mockResolvedValue([]);
    (ExpenseService.subscribeToExpenses as jest.Mock).mockReturnValue(jest.fn());

    (BudgetService.getBudgetsByMonth as jest.Mock).mockResolvedValue([]);
    (BudgetService.subscribeToBudgets as jest.Mock).mockReturnValue(jest.fn());

    (DashboardService.getMonthSummary as jest.Mock).mockResolvedValue({
      month: '2026-08',
      totalIncomeInCents: 0,
      totalIncome: 0,
      currentMonthIncomeInCents: 0,
      currentMonthIncome: 0,
      previousMonthRemainingInCents: 0,
      previousMonthRemaining: 0,
      totalExpensesInCents: 0,
      totalExpenses: 0,
      totalSavingsInCents: 0,
      totalSavings: 0,
      remainingInCents: 0,
      remaining: 0,
      loansTakenIncomeInCents: 0,
      loansTakenIncome: 0,
      expenseCount: 0,
    });
    (DashboardService.getMonthlyTrend as jest.Mock).mockResolvedValue([]);
    (DashboardService.getCategoryBreakdown as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  it('renders AppLayoutGroup and all nested providers without throwing', async () => {
    const { getByTestId } = render(<AppLayoutGroup />);

    await waitFor(() => {
      expect(getByTestId('stack-navigator')).toBeTruthy();
      expect(getByTestId('screen-index')).toBeTruthy();
      expect(getByTestId('screen-expenses/new')).toBeTruthy();
      expect(getByTestId('screen-expenses/[id]')).toBeTruthy();
      expect(getByTestId('screen-budgets/index')).toBeTruthy();
      expect(getByTestId('screen-savings/index')).toBeTruthy();
      expect(getByTestId('screen-drafts/index')).toBeTruthy();
      expect(getByTestId('screen-categories/index')).toBeTruthy();
    });
  });

  it('initializes real-time subscriptions across all providers for authenticated user', async () => {
    render(<AppLayoutGroup />);

    await waitFor(() => {
      expect(ExpenseService.subscribeToExpenses).toHaveBeenCalled();
      expect(CategoryService.subscribeToCustomCategories).toHaveBeenCalled();
      expect(BudgetService.subscribeToBudgets).toHaveBeenCalled();
    });
  });

  it('renders ConnectionStatusBanner when offline or pending items exist', async () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: false,
    });
    (OfflineQueueService.getPendingCount as jest.Mock).mockResolvedValue(2);

    const { getByTestId, findByText } = render(<AppLayoutGroup />);

    const offlineText = await findByText(/Offline/i);
    expect(offlineText).toBeTruthy();
    expect(getByTestId('stack-navigator')).toBeTruthy();
  });
});
