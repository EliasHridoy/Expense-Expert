import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExpenseContext, ExpenseContextValue } from './ExpenseContext';
import { Expense, CreateExpenseDto, UpdateExpenseDto } from '../types/expense.types';
import { ExpenseService } from '../services/expense.service';
import { OfflineQueueService } from '../services/offline-queue.service';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuth } from '../../auth/hooks/useAuth';
import { toCents, fromCents } from '../utils/currency.util';
import { formatMonth, toISODate } from '../utils/date.util';
import { RealtimeSyncManager } from '../../sync/services/RealtimeSyncManager';

interface ExpenseProviderProps {
  children: React.ReactNode;
}

export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [activeMonth, setActiveMonth] = useState<string>(() => formatMonth(new Date()));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const prevIsOnlineRef = useRef<boolean>(isOnline);

  const refreshExpenses = useCallback(
    async (month?: string) => {
      if (!user?.uid) {
        setExpenses([]);
        setPendingSyncCount(0);
        return;
      }

      const targetMonth = month || activeMonth;
      if (month && month !== activeMonth) {
        setActiveMonth(month);
      }

      try {
        const count = await OfflineQueueService.getPendingCount(user.uid);
        setPendingSyncCount(count);

        if (isOnline && typeof ExpenseService.getExpensesByMonth === 'function') {
          setIsLoading(true);
          const remoteExpenses = await ExpenseService.getExpensesByMonth(
            user.uid,
            targetMonth
          );
          setExpenses((prev) => {
            const pendingExpenses = prev.filter((e) => e.syncStatus === 'pending');
            const remoteIds = new Set(remoteExpenses.map((e) => e.id));
            const uniquePending = pendingExpenses.filter((e) => !remoteIds.has(e.id));
            return [...uniquePending, ...remoteExpenses];
          });
        }
      } catch (_error) {
        // Retain existing in-memory state on error or offline
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, activeMonth, isOnline]
  );

  const syncQueue = useCallback(async (): Promise<number> => {
    if (isSyncing || !user?.uid || !isOnline) {
      return 0;
    }

    setIsSyncing(true);
    try {
      const syncedCount = await ExpenseService.processSyncQueue(user.uid);
      const remainingCount = await OfflineQueueService.getPendingCount(user.uid);
      setPendingSyncCount(remainingCount);

      if (syncedCount > 0) {
        await refreshExpenses();
      }

      return syncedCount;
    } catch (_error) {
      return 0;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, user?.uid, isOnline, refreshExpenses]);

  // Real-time subscription for active month
  useEffect(() => {
    if (!user?.uid) {
      setExpenses([]);
      setPendingSyncCount(0);
      return;
    }

    OfflineQueueService.getPendingCount(user.uid).then(setPendingSyncCount);

    const subKey = `expenses_${user.uid}_${activeMonth}`;
    const unsubscribe = RealtimeSyncManager.register(subKey, () => {
      if (typeof ExpenseService.subscribeToExpenses === 'function') {
        const unsub = ExpenseService.subscribeToExpenses(
          user.uid,
          activeMonth,
          (remoteExpenses) => {
            setExpenses((prev) => {
              const pendingItems = prev.filter((item) => item.syncStatus === 'pending');
              const remoteIds = new Set(remoteExpenses.map((e) => e.id));
              const uniquePending = pendingItems.filter((e) => !remoteIds.has(e.id));
              return [...uniquePending, ...remoteExpenses];
            });
            setIsLoading(false);
          },
          (error) => {
            console.warn(`[ExpenseProvider] Subscription error for ${subKey}:`, error);
            setIsLoading(false);
          }
        );
        return typeof unsub === 'function' ? unsub : () => {};
      }
      return () => {};
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid, activeMonth]);

  // Initial load and auth state changes
  useEffect(() => {
    if (user?.uid) {
      OfflineQueueService.getPendingCount(user.uid).then(setPendingSyncCount);
      refreshExpenses(activeMonth);
    } else {
      setExpenses([]);
      setPendingSyncCount(0);
    }
  }, [user?.uid, activeMonth, refreshExpenses]);

  // Auto-sync when transitioning from offline to online
  useEffect(() => {
    const wasOffline = !prevIsOnlineRef.current;
    prevIsOnlineRef.current = isOnline;

    if (wasOffline && isOnline && user?.uid) {
      syncQueue();
    }
  }, [isOnline, user?.uid, syncQueue]);

  const addExpense = useCallback(
    async (dto: CreateExpenseDto): Promise<Expense> => {
      if (!user?.uid) {
        throw new Error('User must be authenticated to add expenses');
      }

      const newExpense = await ExpenseService.addExpense(
        user.uid,
        dto,
        isOnline
      );

      setExpenses((prev) => [newExpense, ...prev]);

      if (newExpense.syncStatus === 'pending') {
        const count = await OfflineQueueService.getPendingCount(user.uid);
        setPendingSyncCount(count);
      }

      return newExpense;
    },
    [user?.uid, isOnline]
  );

  const updateExpense = useCallback(
    async (id: string, dto: UpdateExpenseDto): Promise<void> => {
      if (!user?.uid) {
        throw new Error('User must be authenticated to update expenses');
      }

      await ExpenseService.updateExpense(user.uid, id, dto, isOnline);

      setExpenses((prev) =>
        prev.map((exp) => {
          if (exp.id !== id) return exp;

          const updatedAmountInCents =
            dto.amount !== undefined ? toCents(dto.amount) : exp.amountInCents;
          const updatedAmount =
            dto.amount !== undefined ? fromCents(updatedAmountInCents) : exp.amount;
          const updatedDate =
            dto.date !== undefined ? toISODate(dto.date) : exp.date;
          const updatedMonth =
            dto.date !== undefined ? formatMonth(dto.date) : exp.month;

          return {
            ...exp,
            ...dto,
            amount: updatedAmount,
            amountInCents: updatedAmountInCents,
            date: updatedDate,
            month: updatedMonth,
            updatedAt: new Date().toISOString(),
            syncStatus: isOnline ? exp.syncStatus : 'pending',
          };
        })
      );

      if (!isOnline) {
        const count = await OfflineQueueService.getPendingCount(user.uid);
        setPendingSyncCount(count);
      }
    },
    [user?.uid, isOnline]
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<void> => {
      if (!user?.uid) {
        throw new Error('User must be authenticated to delete expenses');
      }

      await ExpenseService.deleteExpense(user.uid, id, isOnline);

      setExpenses((prev) => prev.filter((exp) => exp.id !== id));

      if (!isOnline) {
        const count = await OfflineQueueService.getPendingCount(user.uid);
        setPendingSyncCount(count);
      }
    },
    [user?.uid, isOnline]
  );

  const getExpenseById = useCallback(
    async (id: string): Promise<Expense | undefined> => {
      const local = expenses.find((e) => e.id === id);
      if (local) {
        return local;
      }

      if (user?.uid && isOnline) {
        const remote = await ExpenseService.getExpenseById(user.uid, id);
        return remote || undefined;
      }

      return undefined;
    },
    [expenses, user?.uid, isOnline]
  );

  const contextValue: ExpenseContextValue = {
    expenses,
    pendingSyncCount,
    isLoading,
    isSyncing,
    isOnline,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    syncQueue,
    refreshExpenses,
  };

  return (
    <ExpenseContext.Provider value={contextValue}>
      {children}
    </ExpenseContext.Provider>
  );
};
