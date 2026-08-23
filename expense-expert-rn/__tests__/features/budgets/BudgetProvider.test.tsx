import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { BudgetProvider } from '../../../src/features/budgets/context/BudgetProvider';
import { useBudgets } from '../../../src/features/budgets/hooks/useBudgets';
import { BudgetService } from '../../../src/features/budgets/services/budget.service';
import { useAuth } from '../../../src/features/auth/hooks/useAuth';
import { ExpenseContext } from '../../../src/features/expenses/context/ExpenseContext';
import { Expense } from '../../../src/features/expenses/types/expense.types';

jest.mock('../../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../src/features/budgets/services/budget.service', () => ({
  BudgetService: {
    getBudgetsByMonth: jest.fn(),
    setCategoryBudget: jest.fn(),
    deleteCategoryBudget: jest.fn(),
  },
}));

describe('BudgetProvider & useBudgets', () => {
  const mockUser = { uid: 'user_test_789', email: 'tester@example.com' };

  const mockExpenses: Expense[] = [
    {
      id: 'exp_1',
      title: 'Groceries',
      description: '',
      amount: 150,
      amountInCents: 15000,
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
    },
    {
      id: 'exp_2',
      title: 'Gas',
      description: '',
      amount: 50,
      amountInCents: 5000,
      category: 'transport',
      date: '2026-08-12T12:00:00.000Z',
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: '2026-08-12T12:00:00.000Z',
      updatedAt: '2026-08-12T12:00:00.000Z',
    },
  ];

  const mockBudgets = [
    {
      id: '2026-08_food',
      userId: 'user_test_789',
      category: 'food',
      month: '2026-08',
      limit: 300,
      limitInCents: 30000,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: '2026-08_transport',
      userId: 'user_test_789',
      category: 'transport',
      month: '2026-08',
      limit: 100,
      limitInCents: 10000,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (BudgetService.getBudgetsByMonth as jest.Mock).mockResolvedValue(mockBudgets);
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

  it('throws error when useBudgets is called outside BudgetProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useBudgets())).toThrow(
      'useBudgets must be used within a BudgetProvider'
    );
    consoleSpy.mockRestore();
  });

  it('initializes and loads budgets for active month', async () => {
    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(BudgetService.getBudgetsByMonth).toHaveBeenCalledWith(mockUser.uid, '2026-08');
    expect(result.current.budgets).toEqual(mockBudgets);
    expect(result.current.activeMonth).toBe('2026-08');
  });

  it('calculates real-time budget usages and summary based on expenses', async () => {
    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // food: $150 of $300 (50%)
    const foodUsage = result.current.budgetUsages.find((u) => u.category === 'food');
    expect(foodUsage).toBeDefined();
    expect(foodUsage?.spentInCents).toBe(15000);
    expect(foodUsage?.remainingInCents).toBe(15000);
    expect(foodUsage?.percentage).toBe(50);
    expect(foodUsage?.thresholdState).toBe('under');

    // transport: $50 of $100 (50%)
    const transportUsage = result.current.budgetUsages.find((u) => u.category === 'transport');
    expect(transportUsage).toBeDefined();
    expect(transportUsage?.spentInCents).toBe(5000);
    expect(transportUsage?.remainingInCents).toBe(5000);
    expect(transportUsage?.percentage).toBe(50);

    // Summary: Total Limit = $400, Total Spent = $200, Remaining = $200 (50%)
    expect(result.current.summary.totalLimitInCents).toBe(40000);
    expect(result.current.summary.totalSpentInCents).toBe(20000);
    expect(result.current.summary.totalRemainingInCents).toBe(20000);
    expect(result.current.summary.percentage).toBe(50);
    expect(result.current.summary.thresholdState).toBe('under');
  });

  it('updates budgets when setActiveMonth is called', async () => {
    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setActiveMonth('2026-09');
    });

    expect(result.current.activeMonth).toBe('2026-09');
    expect(BudgetService.getBudgetsByMonth).toHaveBeenCalledWith(mockUser.uid, '2026-09');
  });

  it('sets budget and updates state via setBudget', async () => {
    const updatedBudget = {
      id: '2026-08_food',
      userId: mockUser.uid,
      category: 'food',
      month: '2026-08',
      limit: 600,
      limitInCents: 60000,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-23T10:00:00.000Z',
    };
    (BudgetService.setCategoryBudget as jest.Mock).mockResolvedValueOnce(updatedBudget);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const res = await result.current.setBudget({
        category: 'food',
        month: '2026-08',
        limit: 600,
      });
      expect(res).toEqual(updatedBudget);
    });

    expect(BudgetService.setCategoryBudget).toHaveBeenCalledWith(mockUser.uid, {
      category: 'food',
      month: '2026-08',
      limit: 600,
    });

    const updatedItem = result.current.budgets.find((b) => b.id === '2026-08_food');
    expect(updatedItem?.limit).toBe(600);
    expect(updatedItem?.limitInCents).toBe(60000);
  });

  it('deletes budget and updates state via deleteBudget', async () => {
    (BudgetService.deleteCategoryBudget as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(result.current.budgets).toHaveLength(2);
    });

    await act(async () => {
      await result.current.deleteBudget('2026-08_transport');
    });

    expect(BudgetService.deleteCategoryBudget).toHaveBeenCalledWith(
      mockUser.uid,
      '2026-08_transport',
      '2026-08'
    );
    expect(result.current.budgets).toHaveLength(1);
    expect(result.current.budgets[0].category).toBe('food');
  });

  it('refreshes budgets via refreshBudgets', async () => {
    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshBudgets();
    });

    expect(BudgetService.getBudgetsByMonth).toHaveBeenCalledTimes(2);
  });

  it('resets budgets when user logs out', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(mockExpenses, '2026-08'),
    });

    expect(result.current.budgets).toEqual([]);
    expect(result.current.budgetUsages).toEqual([]);
  });
});
