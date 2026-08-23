import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ExpenseProvider } from '@/features/expenses/context/ExpenseProvider';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { ExpenseService } from '@/features/expenses/services/expense.service';
import { OfflineQueueService } from '@/features/expenses/services/offline-queue.service';
import { RealtimeSyncManager } from '@/features/sync/services/RealtimeSyncManager';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNetworkStatus } from '@/features/expenses/hooks/useNetworkStatus';
import { Expense } from '@/features/expenses/types/expense.types';

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
    subscribeToExpenses: jest.fn(),
  },
}));

jest.mock('@/features/expenses/services/offline-queue.service', () => ({
  OfflineQueueService: {
    getPendingCount: jest.fn(),
    enqueue: jest.fn(),
  },
}));

describe('ExpenseProvider Realtime & Reconciliation', () => {
  const mockUser = { uid: 'realtime_user_1', email: 'rt@example.com' };
  let capturedOnData: ((expenses: Expense[]) => void) | null = null;
  let capturedUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    RealtimeSyncManager.teardownAll();
    capturedUnsubscribe = jest.fn();
    capturedOnData = null;

    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (OfflineQueueService.getPendingCount as jest.Mock).mockResolvedValue(0);
    (ExpenseService.getExpensesByMonth as jest.Mock).mockResolvedValue([]);

    (ExpenseService.subscribeToExpenses as jest.Mock).mockImplementation(
      (_userId: string, _month: string, onData: (expenses: Expense[]) => void) => {
        capturedOnData = onData;
        return capturedUnsubscribe;
      }
    );
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ExpenseProvider>{children}</ExpenseProvider>
  );

  it('subscribes to real-time expenses via RealtimeSyncManager on mount', async () => {
    const { result } = renderHook(() => useExpenses(), { wrapper });

    await waitFor(() => {
      expect(ExpenseService.subscribeToExpenses).toHaveBeenCalledWith(
        'realtime_user_1',
        expect.any(String),
        expect.any(Function),
        expect.any(Function)
      );
    });

    expect(capturedOnData).toBeDefined();

    // Emit a snapshot
    const remoteExpenses: Expense[] = [
      {
        id: 'exp_live_1',
        title: 'Coffee',
        description: '',
        amount: 4.5,
        amountInCents: 450,
        category: 'Food',
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
        syncStatus: 'synced',
      },
    ];

    act(() => {
      capturedOnData!(remoteExpenses);
    });

    expect(result.current.expenses).toEqual(remoteExpenses);
  });

  it('preserves uncommitted optimistic pending mutations when remote snapshot arrives', async () => {
    // Start offline
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });

    const offlineExpense: Expense = {
      id: 'exp_pending_1',
      title: 'Offline Subway',
      description: '',
      amount: 8.0,
      amountInCents: 800,
      category: 'Transport',
      date: '2026-08-23T11:00:00.000Z',
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: '2026-08-23T11:00:00.000Z',
      updatedAt: '2026-08-23T11:00:00.000Z',
      syncStatus: 'pending',
    };

    (ExpenseService.addExpense as jest.Mock).mockResolvedValue(offlineExpense);

    const { result } = renderHook(() => useExpenses(), { wrapper });

    // Add offline expense
    await act(async () => {
      await result.current.addExpense({
        title: 'Offline Subway',
        amount: 8.0,
        category: 'Transport',
        date: '2026-08-23T11:00:00.000Z',
      });
    });

    expect(result.current.expenses).toContainEqual(offlineExpense);

    // Remote snapshot arrives without the pending item yet
    const remoteExpenses: Expense[] = [
      {
        id: 'exp_server_1',
        title: 'Server Sync Item',
        description: '',
        amount: 20.0,
        amountInCents: 2000,
        category: 'Food',
        date: '2026-08-23T09:00:00.000Z',
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: '2026-08-23T09:00:00.000Z',
        updatedAt: '2026-08-23T09:00:00.000Z',
        syncStatus: 'synced',
      },
    ];

    act(() => {
      capturedOnData!(remoteExpenses);
    });

    // Pending item is retained alongside server item
    expect(result.current.expenses).toHaveLength(2);
    expect(result.current.expenses.find((e) => e.id === 'exp_pending_1')).toBeDefined();
    expect(result.current.expenses.find((e) => e.id === 'exp_server_1')).toBeDefined();
  });

  it('replaces pending item when server snapshot includes the synced item', async () => {
    const pendingExpense: Expense = {
      id: 'exp_item_1',
      title: 'Pending Snack',
      description: '',
      amount: 5.0,
      amountInCents: 500,
      category: 'Food',
      date: '2026-08-23T11:00:00.000Z',
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: '2026-08-23T11:00:00.000Z',
      updatedAt: '2026-08-23T11:00:00.000Z',
      syncStatus: 'pending',
    };

    (ExpenseService.addExpense as jest.Mock).mockResolvedValue(pendingExpense);

    const { result } = renderHook(() => useExpenses(), { wrapper });

    await act(async () => {
      await result.current.addExpense({
        title: 'Pending Snack',
        amount: 5.0,
        category: 'Food',
        date: '2026-08-23T11:00:00.000Z',
      });
    });

    // Remote snapshot arrives and includes exp_item_1 as synced
    const confirmedExpense: Expense = {
      ...pendingExpense,
      syncStatus: 'synced',
    };

    act(() => {
      capturedOnData!([confirmedExpense]);
    });

    expect(result.current.expenses).toHaveLength(1);
    expect(result.current.expenses[0].syncStatus).toBe('synced');
  });

  it('re-subscribes when activeMonth changes via refreshExpenses', async () => {
    const { result } = renderHook(() => useExpenses(), { wrapper });

    await waitFor(() => {
      expect(ExpenseService.subscribeToExpenses).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.refreshExpenses('2026-09');
    });

    expect(ExpenseService.subscribeToExpenses).toHaveBeenCalledWith(
      'realtime_user_1',
      '2026-09',
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('unsubscribes listener on unmount', async () => {
    const { unmount } = renderHook(() => useExpenses(), { wrapper });

    await waitFor(() => {
      expect(ExpenseService.subscribeToExpenses).toHaveBeenCalled();
    });

    unmount();

    expect(capturedUnsubscribe).toHaveBeenCalled();
  });
});
