import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { BudgetProvider } from '@/features/budgets/context/BudgetProvider';
import { useBudgets } from '@/features/budgets/hooks/useBudgets';
import { BudgetService } from '@/features/budgets/services/budget.service';
import { RealtimeSyncManager } from '@/features/sync/services/RealtimeSyncManager';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ExpenseContext } from '@/features/expenses/context/ExpenseContext';
import { Expense } from '@/features/expenses/types/expense.types';
import { CategoryBudget } from '@/features/budgets/types/budget.types';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/budgets/services/budget.service', () => ({
  BudgetService: {
    getBudgetsByMonth: jest.fn(),
    setCategoryBudget: jest.fn(),
    deleteCategoryBudget: jest.fn(),
    subscribeToBudgets: jest.fn(),
  },
}));

describe('BudgetProvider Realtime', () => {
  const mockUser = { uid: 'budget_user_rt', email: 'budget_rt@example.com' };
  let capturedOnData: ((budgets: CategoryBudget[]) => void) | null = null;
  let capturedUnsubscribe: jest.Mock;

  const mockExpenses: Expense[] = [
    {
      id: 'exp_food_1',
      title: 'Groceries',
      description: '',
      amount: 100,
      amountInCents: 10000,
      category: 'food',
      date: '2026-08-10T12:00:00.000Z',
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: '2026-08-10T12:00:00.000Z',
      updatedAt: '2026-08-10T12:00:00.000Z',
      syncStatus: 'synced',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    RealtimeSyncManager.teardownAll();
    capturedUnsubscribe = jest.fn();
    capturedOnData = null;

    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (BudgetService.getBudgetsByMonth as jest.Mock).mockResolvedValue([]);

    (BudgetService.subscribeToBudgets as jest.Mock).mockImplementation(
      (_userId: string, _month: string, onData: (budgets: CategoryBudget[]) => void) => {
        capturedOnData = onData;
        return capturedUnsubscribe;
      }
    );
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  const createWrapper = (expenses: Expense[] = mockExpenses, initialMonth = '2026-08') => {
    return ({ children }: { children: React.ReactNode }) => (
      <ExpenseContext.Provider
        value={{
          expenses,
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
        }}
      >
        <BudgetProvider initialMonth={initialMonth}>{children}</BudgetProvider>
      </ExpenseContext.Provider>
    );
  };

  it('subscribes to real-time budgets for active month on mount', async () => {
    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(BudgetService.subscribeToBudgets).toHaveBeenCalledWith(
        'budget_user_rt',
        '2026-08',
        expect.any(Function),
        expect.any(Function)
      );
    });

    expect(capturedOnData).toBeDefined();

    const liveBudgets: CategoryBudget[] = [
      {
        id: '2026-08_food',
        userId: 'budget_user_rt',
        category: 'food',
        month: '2026-08',
        limit: 200,
        limitInCents: 20000,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    act(() => {
      capturedOnData!(liveBudgets);
    });

    expect(result.current.budgets).toEqual(liveBudgets);

    // Derived usages: $100 of $200 spent (50%)
    const foodUsage = result.current.budgetUsages.find((u) => u.category === 'food');
    expect(foodUsage).toBeDefined();
    expect(foodUsage?.spentInCents).toBe(10000);
    expect(foodUsage?.percentage).toBe(50);

    // Summary calculation
    expect(result.current.summary.totalLimitInCents).toBe(20000);
    expect(result.current.summary.totalSpentInCents).toBe(10000);
    expect(result.current.summary.percentage).toBe(50);
  });

  it('re-subscribes when activeMonth changes via setActiveMonth', async () => {
    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(BudgetService.subscribeToBudgets).toHaveBeenCalledWith(
        'budget_user_rt',
        '2026-08',
        expect.any(Function),
        expect.any(Function)
      );
    });

    await act(async () => {
      result.current.setActiveMonth('2026-09');
    });

    expect(capturedUnsubscribe).toHaveBeenCalled();
    expect(BudgetService.subscribeToBudgets).toHaveBeenCalledWith(
      'budget_user_rt',
      '2026-09',
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(BudgetService.subscribeToBudgets).toHaveBeenCalled();
    });

    unmount();

    expect(capturedUnsubscribe).toHaveBeenCalled();
  });
});
