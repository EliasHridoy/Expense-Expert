import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ExpenseProvider } from '@/features/expenses/context/ExpenseProvider';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { ExpenseService } from '@/features/expenses/services/expense.service';
import { OfflineQueueService } from '@/features/expenses/services/offline-queue.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNetworkStatus } from '@/features/expenses/hooks/useNetworkStatus';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/expenses/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock('@/features/expenses/services/expense.service', () => ({
  ExpenseService: {
    addExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    getExpensesByMonth: jest.fn(),
    getExpenseById: jest.fn(),
    processSyncQueue: jest.fn(),
  },
}));

jest.mock('@/features/expenses/services/offline-queue.service', () => ({
  OfflineQueueService: {
    getPendingCount: jest.fn(),
  },
}));

describe('ExpenseProvider & useExpenses', () => {
  const mockUser = { uid: 'user_test_123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (OfflineQueueService.getPendingCount as jest.Mock).mockResolvedValue(0);
    (ExpenseService.getExpensesByMonth as jest.Mock).mockResolvedValue([]);
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ExpenseProvider>{children}</ExpenseProvider>
  );

  it('throws error if useExpenses is called outside ExpenseProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useExpenses())).toThrow(
      'useExpenses must be used within an ExpenseProvider'
    );
    consoleSpy.mockRestore();
  });

  it('initializes and loads current month expenses when user is logged in', async () => {
    const mockExpenses = [
      {
        id: 'exp_1',
        title: 'Lunch',
        amount: 12.5,
        amountInCents: 1250,
        category: 'Food',
        date: '2026-08-23T00:00:00.000Z',
        month: '2026-08',
        syncStatus: 'synced',
      },
    ];
    (ExpenseService.getExpensesByMonth as jest.Mock).mockResolvedValue(mockExpenses);

    const { result } = renderHook(() => useExpenses(), { wrapper });

    await waitFor(() => {
      expect(result.current.expenses).toEqual(mockExpenses);
    });

    expect(ExpenseService.getExpensesByMonth).toHaveBeenCalled();
  });

  it('adds expense optimistically and calls ExpenseService.addExpense', async () => {
    const created = {
      id: 'exp_new',
      title: 'Groceries',
      amount: 50.0,
      amountInCents: 5000,
      category: 'Food',
      date: '2026-08-23T00:00:00.000Z',
      month: '2026-08',
      syncStatus: 'synced',
    };
    (ExpenseService.addExpense as jest.Mock).mockResolvedValue(created);

    const { result } = renderHook(() => useExpenses(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let addedResult;
    await act(async () => {
      addedResult = await result.current.addExpense({
        title: 'Groceries',
        amount: 50.0,
        category: 'Food',
        date: '2026-08-23T00:00:00.000Z',
      });
    });

    expect(addedResult).toEqual(created);
    expect(result.current.expenses).toContainEqual(created);
    expect(ExpenseService.addExpense).toHaveBeenCalledWith(
      'user_test_123',
      expect.objectContaining({ title: 'Groceries' }),
      true
    );
  });

  it('updates expense optimistically and calls ExpenseService.updateExpense', async () => {
    const initial = {
      id: 'exp_1',
      title: 'Lunch',
      amount: 10,
      amountInCents: 1000,
      category: 'Food',
      date: '2026-08-23T00:00:00.000Z',
      month: '2026-08',
      syncStatus: 'synced',
    };
    (ExpenseService.getExpensesByMonth as jest.Mock).mockResolvedValue([initial]);
    (ExpenseService.updateExpense as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpenses(), { wrapper });

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateExpense('exp_1', { title: 'Updated Lunch', amount: 15 });
    });

    expect(result.current.expenses[0].title).toBe('Updated Lunch');
    expect(result.current.expenses[0].amount).toBe(15);
    expect(result.current.expenses[0].amountInCents).toBe(1500);
    expect(ExpenseService.updateExpense).toHaveBeenCalledWith(
      'user_test_123',
      'exp_1',
      { title: 'Updated Lunch', amount: 15 },
      true
    );
  });

  it('deletes expense optimistically and calls ExpenseService.deleteExpense', async () => {
    const initial = {
      id: 'exp_1',
      title: 'Lunch',
      amount: 10,
      amountInCents: 1000,
      category: 'Food',
      date: '2026-08-23T00:00:00.000Z',
      month: '2026-08',
      syncStatus: 'synced',
    };
    (ExpenseService.getExpensesByMonth as jest.Mock).mockResolvedValue([initial]);
    (ExpenseService.deleteExpense as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpenses(), { wrapper });

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteExpense('exp_1');
    });

    expect(result.current.expenses).toHaveLength(0);
    expect(ExpenseService.deleteExpense).toHaveBeenCalledWith(
      'user_test_123',
      'exp_1',
      true
    );
  });

  it('triggers syncQueue and refreshes expenses on manual sync', async () => {
    (ExpenseService.processSyncQueue as jest.Mock).mockResolvedValue(2);
    (OfflineQueueService.getPendingCount as jest.Mock).mockResolvedValue(0);

    const { result } = renderHook(() => useExpenses(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let syncedCount = 0;
    await act(async () => {
      syncedCount = await result.current.syncQueue();
    });

    expect(syncedCount).toBe(2);
    expect(ExpenseService.processSyncQueue).toHaveBeenCalledWith('user_test_123');
  });
});
