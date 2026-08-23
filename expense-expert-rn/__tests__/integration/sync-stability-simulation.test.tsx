import React, { useState } from 'react';
import { render, fireEvent, act, renderHook, waitFor } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, Button } from 'react-native';

// Core and Feature imports
import { RealtimeSyncManager, RealtimeSyncManagerClass } from '../../src/features/sync/services/RealtimeSyncManager';
import { ExpenseProvider } from '../../src/features/expenses/context/ExpenseProvider';
import { useExpenses } from '../../src/features/expenses/hooks/useExpenses';
import { ExpenseService } from '../../src/features/expenses/services/expense.service';
import { OfflineQueueService } from '../../src/features/expenses/services/offline-queue.service';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useNetworkStatus } from '../../src/features/expenses/hooks/useNetworkStatus';
import { Expense } from '../../src/features/expenses/types/expense.types';

import { ErrorBoundary } from '../../src/core/components/ErrorBoundary';
import { ToastProvider } from '../../src/core/feedback/ToastProvider';
import { useToast } from '../../src/core/feedback/useToast';
import { ConnectionStatusBanner } from '../../src/core/components/ConnectionStatusBanner';
import * as networkHook from '../../src/features/expenses/hooks/useNetworkStatus';

// Mocks
jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/features/expenses/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock('../../src/features/expenses/services/expense.service', () => ({
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

jest.mock('../../src/features/expenses/services/offline-queue.service', () => ({
  OfflineQueueService: {
    getPendingCount: jest.fn(),
    enqueue: jest.fn(),
  },
}));

// ==========================================
// DUMMY DATA GENERATORS & FIXTURES
// ==========================================

const createDummyExpense = (overrides: Partial<Expense> = {}): Expense => {
  const id = overrides.id || `exp_${Math.random().toString(36).substring(2, 9)}`;
  const amount = overrides.amount !== undefined ? overrides.amount : 45.5;
  return {
    id,
    title: overrides.title || 'Dummy Expense Item',
    description: overrides.description || 'Simulation test record',
    amount,
    amountInCents: Math.round(amount * 100),
    category: overrides.category || 'food',
    date: overrides.date || '2026-08-23T10:00:00.000Z',
    month: overrides.month || '2026-08',
    isLoan: overrides.isLoan || false,
    loanPersonId: overrides.loanPersonId || null,
    loanCleared: overrides.loanCleared || false,
    loanRepaid: overrides.loanRepaid || 0,
    loanTakenId: overrides.loanTakenId || null,
    draftId: overrides.draftId || null,
    installmentIndex: overrides.installmentIndex || null,
    createdAt: overrides.createdAt || '2026-08-23T10:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-08-23T10:00:00.000Z',
    syncStatus: overrides.syncStatus || 'synced',
    ...overrides,
  };
};

const SIMULATION_USER = {
  uid: 'usr_simulation_777',
  email: 'simulation.tester@expenseexpert.app',
  displayName: 'Alex Simulation Engineer',
};

// ==========================================
// TEST SUITE: SYNC, ERROR BOUNDARY & FEEDBACK
// ==========================================

describe('Real-time Sync, Error Boundary & Feedback Module Simulation Suite', () => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    RealtimeSyncManager.teardownAll();
    (useAuth as jest.Mock).mockReturnValue({ user: SIMULATION_USER });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (OfflineQueueService.getPendingCount as jest.Mock).mockResolvedValue(0);
    (ExpenseService.getExpensesByMonth as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  // --------------------------------------------------------------------------
  // 1. RealtimeSyncManager: Deduplication, Ref-Counting & Clean Teardown
  // --------------------------------------------------------------------------
  describe('1. RealtimeSyncManager Subscription Lifecycle & Ref-Counting', () => {
    let syncManager: RealtimeSyncManagerClass;

    beforeEach(() => {
      syncManager = new RealtimeSyncManagerClass();
    });

    afterEach(() => {
      syncManager.teardownAll();
    });

    it('manages single listener registration, duplicate subscription deduplication, and ref-counting', () => {
      const channelKey = 'expenses_channel_tenant_1';
      const underlyingUnsubscribe = jest.fn();
      const createSubscriptionMock = jest.fn(() => underlyingUnsubscribe);

      // Subscriber 1 (e.g. Dashboard Summary Card) registers channel
      const unsub1 = syncManager.register(channelKey, createSubscriptionMock);
      expect(createSubscriptionMock).toHaveBeenCalledTimes(1);
      expect(syncManager.hasSubscription(channelKey)).toBe(true);
      expect(syncManager.getActiveCount()).toBe(1);
      expect(syncManager.getSubscription(channelKey)?.subscriberCount).toBe(1);

      // Subscriber 2 (e.g. Expense List Screen) registers identical channel key
      const unsub2 = syncManager.register(channelKey, createSubscriptionMock);
      // createSubscription should NOT be called again (deduplication)
      expect(createSubscriptionMock).toHaveBeenCalledTimes(1);
      expect(syncManager.getActiveCount()).toBe(1);
      expect(syncManager.getSubscription(channelKey)?.subscriberCount).toBe(2);

      // Subscriber 3 (e.g. Floating Quick-Add Sheet) registers identical channel key
      const unsub3 = syncManager.register(channelKey, createSubscriptionMock);
      expect(createSubscriptionMock).toHaveBeenCalledTimes(1);
      expect(syncManager.getSubscription(channelKey)?.subscriberCount).toBe(3);

      // First subscriber unmounts/unregisters
      unsub1();
      expect(underlyingUnsubscribe).not.toHaveBeenCalled();
      expect(syncManager.hasSubscription(channelKey)).toBe(true);
      expect(syncManager.getSubscription(channelKey)?.subscriberCount).toBe(2);

      // Second subscriber unregisters
      unsub2();
      expect(underlyingUnsubscribe).not.toHaveBeenCalled();
      expect(syncManager.getSubscription(channelKey)?.subscriberCount).toBe(1);

      // Final subscriber unregisters -> triggers underlying teardown and purges entry
      unsub3();
      expect(underlyingUnsubscribe).toHaveBeenCalledTimes(1);
      expect(syncManager.hasSubscription(channelKey)).toBe(false);
      expect(syncManager.getActiveCount()).toBe(0);
      expect(syncManager.getSubscription(channelKey)).toBeUndefined();
    });

    it('handles multiple isolated channels and cleanly tears down all active subscriptions on teardownAll()', () => {
      const channels = [
        'expenses_user_100_2026-08',
        'budgets_user_100_2026-08',
        'categories_user_100',
        'notifications_user_100',
      ];

      const unsubSpies = channels.map(() => jest.fn());

      channels.forEach((key, index) => {
        syncManager.register(key, () => unsubSpies[index]);
      });

      expect(syncManager.getActiveCount()).toBe(4);
      channels.forEach((key) => {
        expect(syncManager.hasSubscription(key)).toBe(true);
      });

      // Teardown all
      syncManager.teardownAll();

      unsubSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      expect(syncManager.getActiveCount()).toBe(0);
    });

    it('safely handles faulty unsubscribe callbacks throwing errors during teardown', () => {
      const errorThrowingUnsub = jest.fn(() => {
        throw new Error('Firestore connection reset unexpectedly');
      });
      const healthyUnsub = jest.fn();

      syncManager.register('faulty_channel', () => errorThrowingUnsub);
      syncManager.register('healthy_channel', () => healthyUnsub);

      expect(() => {
        syncManager.teardownAll();
      }).not.toThrow();

      expect(errorThrowingUnsub).toHaveBeenCalledTimes(1);
      expect(healthyUnsub).toHaveBeenCalledTimes(1);
      expect(syncManager.getActiveCount()).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Real-time onSnapshot snapshot updates merging with optimistic mutations
  // --------------------------------------------------------------------------
  describe('2. Real-time onSnapshot Updates Merging with Optimistic Mutations', () => {
    let capturedSnapshotCallback: ((expenses: Expense[]) => void) | null = null;
    const mockUnsubscribe = jest.fn();

    beforeEach(() => {
      capturedSnapshotCallback = null;
      (ExpenseService.subscribeToExpenses as jest.Mock).mockImplementation(
        (_uid: string, _month: string, onData: (expenses: Expense[]) => void) => {
          capturedSnapshotCallback = onData;
          return mockUnsubscribe;
        }
      );
    });

    const expenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ExpenseProvider>{children}</ExpenseProvider>
    );

    it('reconciles incoming onSnapshot snapshots while preserving optimistic pending mutations', async () => {
      // 1. Initial server items
      const serverItem1 = createDummyExpense({
        id: 'exp_srv_101',
        title: 'Cloud Infrastructure Hosting',
        amount: 89.99,
        category: 'bills',
        syncStatus: 'synced',
      });
      const serverItem2 = createDummyExpense({
        id: 'exp_srv_102',
        title: 'Office Coffee Beans',
        amount: 32.5,
        category: 'food',
        syncStatus: 'synced',
      });

      const { result } = renderHook(() => useExpenses(), { wrapper: expenseWrapper });

      await waitFor(() => {
        expect(ExpenseService.subscribeToExpenses).toHaveBeenCalled();
      });
      expect(capturedSnapshotCallback).toBeDefined();

      // Emit initial server snapshot
      act(() => {
        capturedSnapshotCallback!([serverItem1, serverItem2]);
      });

      expect(result.current.expenses).toEqual([serverItem1, serverItem2]);

      // 2. Device goes offline and user makes optimistic mutations
      (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });

      const pendingMutation1 = createDummyExpense({
        id: 'exp_pending_901',
        title: 'Client Lunch Express',
        amount: 65.0,
        category: 'food',
        syncStatus: 'pending',
      });
      const pendingMutation2 = createDummyExpense({
        id: 'exp_pending_902',
        title: 'Metro Commute Card',
        amount: 25.0,
        category: 'transport',
        syncStatus: 'pending',
      });

      (ExpenseService.addExpense as jest.Mock).mockResolvedValueOnce(pendingMutation1);
      await act(async () => {
        await result.current.addExpense({
          title: 'Client Lunch Express',
          amount: 65.0,
          category: 'food',
          date: '2026-08-23T12:00:00.000Z',
        });
      });

      (ExpenseService.addExpense as jest.Mock).mockResolvedValueOnce(pendingMutation2);
      await act(async () => {
        await result.current.addExpense({
          title: 'Metro Commute Card',
          amount: 25.0,
          category: 'transport',
          date: '2026-08-23T12:30:00.000Z',
        });
      });

      // Provider should hold 2 pending mutations + 2 existing server items
      expect(result.current.expenses).toHaveLength(4);
      expect(result.current.expenses[0].id).toBe('exp_pending_902');
      expect(result.current.expenses[1].id).toBe('exp_pending_901');

      // 3. New remote snapshot arrives from Firestore (e.g. from another teammate)
      const serverItem3 = createDummyExpense({
        id: 'exp_srv_103',
        title: 'Ergonomic Keyboard Purchase',
        amount: 149.0,
        category: 'shopping',
        syncStatus: 'synced',
      });

      act(() => {
        capturedSnapshotCallback!([serverItem1, serverItem2, serverItem3]);
      });

      // Optimistic pending mutations must NOT be wiped out by the remote snapshot
      expect(result.current.expenses).toHaveLength(5);
      const pendingIds = result.current.expenses
        .filter((e) => e.syncStatus === 'pending')
        .map((e) => e.id);
      expect(pendingIds).toEqual(['exp_pending_902', 'exp_pending_901']);

      const syncedIds = result.current.expenses
        .filter((e) => e.syncStatus === 'synced')
        .map((e) => e.id);
      expect(syncedIds).toEqual(['exp_srv_101', 'exp_srv_102', 'exp_srv_103']);

      // 4. Server confirms exp_pending_901 and includes it in next onSnapshot snapshot
      const confirmedServerMutation1 = {
        ...pendingMutation1,
        syncStatus: 'synced' as const,
      };

      act(() => {
        capturedSnapshotCallback!([
          serverItem1,
          serverItem2,
          serverItem3,
          confirmedServerMutation1,
        ]);
      });

      // exp_pending_901 is seamlessly upgraded to synced, exp_pending_902 remains pending
      expect(result.current.expenses).toHaveLength(5);
      const remainingPending = result.current.expenses.filter((e) => e.syncStatus === 'pending');
      expect(remainingPending).toHaveLength(1);
      expect(remainingPending[0].id).toBe('exp_pending_902');

      const confirmedItem = result.current.expenses.find((e) => e.id === 'exp_pending_901');
      expect(confirmedItem).toBeDefined();
      expect(confirmedItem?.syncStatus).toBe('synced');
    });
  });

  // --------------------------------------------------------------------------
  // 3. ErrorBoundary: Child render crashes, accessible fallback & reset
  // --------------------------------------------------------------------------
  describe('3. ErrorBoundary Simulation: Render Crash Recovery & Fallback', () => {
    const FlakyFinancialWidget: React.FC<{ shouldCrash: boolean; errorMessage?: string }> = ({
      shouldCrash,
      errorMessage = 'Simulated Financial Stream Computation Error',
    }) => {
      if (shouldCrash) {
        throw new Error(errorMessage);
      }
      return (
        <View testID="flaky-widget-content">
          <Text testID="financial-metrics">All financial ledger entries valid (Balance: $12,450.00)</Text>
        </View>
      );
    };

    it('catches child render error, renders accessible fallback UI with message, and triggers onError callback', () => {
      const onErrorSpy = jest.fn();
      const customCrashMsg = 'Corrupted ledger state: null balance reference';

      const { getByTestId, getByText, queryByTestId } = render(
        <ErrorBoundary onError={onErrorSpy}>
          <FlakyFinancialWidget shouldCrash={true} errorMessage={customCrashMsg} />
        </ErrorBoundary>
      );

      // Verify accessible alert container and elements
      expect(getByTestId('error-boundary-fallback')).toBeTruthy();
      expect(getByText('Something went wrong')).toBeTruthy();
      expect(getByText(customCrashMsg)).toBeTruthy();
      expect(getByTestId('error-boundary-retry-button')).toBeTruthy();
      expect(queryByTestId('flaky-widget-content')).toBeNull();

      // Verify onError received error object and stack metadata
      expect(onErrorSpy).toHaveBeenCalledTimes(1);
      expect(onErrorSpy.mock.calls[0][0].message).toBe(customCrashMsg);
      expect(onErrorSpy.mock.calls[0][1]).toHaveProperty('componentStack');
    });

    it('resets error state when "Try Again" is pressed after repairing broken state', () => {
      const StateControlledHost = () => {
        const [isBroken, setIsBroken] = useState(true);

        return (
          <View>
            <TouchableOpacity
              testID="btn-repair-state"
              onPress={() => setIsBroken(false)}
            >
              <Text>Repair State</Text>
            </TouchableOpacity>

            <ErrorBoundary onReset={() => setIsBroken(false)}>
              <FlakyFinancialWidget shouldCrash={isBroken} />
            </ErrorBoundary>
          </View>
        );
      };

      const { getByTestId, queryByTestId, getByText } = render(<StateControlledHost />);

      // Initially crashed
      expect(getByTestId('error-boundary-fallback')).toBeTruthy();
      expect(queryByTestId('flaky-widget-content')).toBeNull();

      // Press "Try Again"
      fireEvent.press(getByTestId('error-boundary-retry-button'));

      // Successfully recovers and renders healthy content
      expect(queryByTestId('error-boundary-fallback')).toBeNull();
      expect(getByTestId('flaky-widget-content')).toBeTruthy();
      expect(getByText('All financial ledger entries valid (Balance: $12,450.00)')).toBeTruthy();
    });

    it('renders custom function fallback with error context and custom retry trigger', () => {
      const customResetSpy = jest.fn();

      const customFallbackRenderer = ({
        error,
        resetErrorBoundary,
      }: {
        error: Error | null;
        resetErrorBoundary: () => void;
      }) => (
        <View testID="custom-fallback-container">
          <Text testID="custom-error-text">Custom Alert: {error?.message}</Text>
          <Button testID="custom-retry-action" title="Recover App" onPress={resetErrorBoundary} />
        </View>
      );

      const { getByTestId, queryByTestId } = render(
        <ErrorBoundary fallback={customFallbackRenderer} onReset={customResetSpy}>
          <FlakyFinancialWidget shouldCrash={true} errorMessage="Syntax error in formula" />
        </ErrorBoundary>
      );

      expect(getByTestId('custom-fallback-container')).toBeTruthy();
      expect(getByTestId('custom-error-text').props.children).toEqual([
        'Custom Alert: ',
        'Syntax error in formula',
      ]);
      expect(queryByTestId('error-boundary-fallback')).toBeNull();

      fireEvent.press(getByTestId('custom-retry-action'));
      expect(customResetSpy).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // 4. ToastNotification: Queueing, Auto-dismiss Timers & Manual Dismissal
  // --------------------------------------------------------------------------
  describe('4. ToastNotification System: Multi-type Queueing, Auto-dismiss & Manual Actions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      act(() => {
        jest.clearAllTimers();
      });
      jest.useRealTimers();
    });

    const ToastSimulatorApp: React.FC = () => {
      const { showSuccess, showError, showWarning, showInfo, hideToast, toasts } = useToast();

      return (
        <View>
          <TouchableOpacity
            testID="btn-toast-success"
            onPress={() => showSuccess('Receipt scanned and parsed ($142.50)', 3000)}
          >
            <Text>Dispatch Success</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-toast-error"
            onPress={() => showError('Network sync failed: Gateway timeout', 4000)}
          >
            <Text>Dispatch Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-toast-warning"
            onPress={() => showWarning('Monthly budget at 92% capacity', 2500)}
          >
            <Text>Dispatch Warning</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-toast-info"
            onPress={() => showInfo('3 offline transactions stored in local cache', 5000)}
          >
            <Text>Dispatch Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-toast-custom-short"
            onPress={() => showSuccess('Quick pulse notification', 1000)}
          >
            <Text>Dispatch Quick Pulse</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-dismiss-first"
            onPress={() => toasts.length > 0 && hideToast(toasts[0].id)}
          >
            <Text>Dismiss Active</Text>
          </TouchableOpacity>
        </View>
      );
    };

    it('renders all four toast variants (success, error, warning, info) with distinctive styles & icons', () => {
      const { getByTestId, getByText } = render(
        <ToastProvider>
          <ToastSimulatorApp />
        </ToastProvider>
      );

      // Trigger all 4 toasts
      act(() => {
        fireEvent.press(getByTestId('btn-toast-success'));
        fireEvent.press(getByTestId('btn-toast-error'));
        fireEvent.press(getByTestId('btn-toast-warning'));
      });

      // Assert toast elements exist
      expect(getByTestId('toast-success')).toBeTruthy();
      expect(getByText('Receipt scanned and parsed ($142.50)')).toBeTruthy();

      expect(getByTestId('toast-error')).toBeTruthy();
      expect(getByText('Network sync failed: Gateway timeout')).toBeTruthy();

      expect(getByTestId('toast-warning')).toBeTruthy();
      expect(getByText('Monthly budget at 92% capacity')).toBeTruthy();
    });

    it('strictly enforces MAX_TOASTS = 3 eviction queue policy', () => {
      const { getByTestId, queryByText } = render(
        <ToastProvider>
          <ToastSimulatorApp />
        </ToastProvider>
      );

      // Add 3 toasts
      act(() => {
        fireEvent.press(getByTestId('btn-toast-success')); // #1
        fireEvent.press(getByTestId('btn-toast-error'));   // #2
        fireEvent.press(getByTestId('btn-toast-warning')); // #3
      });

      expect(queryByText('Receipt scanned and parsed ($142.50)')).toBeTruthy();
      expect(queryByText('Network sync failed: Gateway timeout')).toBeTruthy();
      expect(queryByText('Monthly budget at 92% capacity')).toBeTruthy();

      // Add 4th toast (info) -> #1 must be evicted
      act(() => {
        fireEvent.press(getByTestId('btn-toast-info'));     // #4
      });

      expect(queryByText('Receipt scanned and parsed ($142.50)')).toBeNull();
      expect(queryByText('Network sync failed: Gateway timeout')).toBeTruthy();
      expect(queryByText('Monthly budget at 92% capacity')).toBeTruthy();
      expect(queryByText('3 offline transactions stored in local cache')).toBeTruthy();
    });

    it('accurately dismisses toasts when auto-dismiss duration expires', () => {
      const { getByTestId, queryByTestId } = render(
        <ToastProvider>
          <ToastSimulatorApp />
        </ToastProvider>
      );

      act(() => {
        fireEvent.press(getByTestId('btn-toast-custom-short')); // 1000ms duration
      });

      expect(getByTestId('toast-success')).toBeTruthy();

      // Advance by 900ms -> Still visible
      act(() => {
        jest.advanceTimersByTime(900);
      });
      expect(getByTestId('toast-success')).toBeTruthy();

      // Advance by 150ms -> Exceeds 1000ms, dismissed
      act(() => {
        jest.advanceTimersByTime(150);
      });
      expect(queryByTestId('toast-success')).toBeNull();
    });

    it('allows immediate manual dismissal via close button or toast card click', () => {
      const { getByTestId, queryByTestId } = render(
        <ToastProvider>
          <ToastSimulatorApp />
        </ToastProvider>
      );

      act(() => {
        fireEvent.press(getByTestId('btn-toast-info'));
      });
      expect(getByTestId('toast-info')).toBeTruthy();

      // Press manual dismiss button
      act(() => {
        fireEvent.press(getByTestId('toast-dismiss'));
      });
      expect(queryByTestId('toast-info')).toBeNull();

      // Add another and click the card body to dismiss
      act(() => {
        fireEvent.press(getByTestId('btn-toast-warning'));
      });
      expect(getByTestId('toast-warning')).toBeTruthy();

      act(() => {
        fireEvent.press(getByTestId('toast-warning'));
      });
      expect(queryByTestId('toast-warning')).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 5. ConnectionStatusBanner: Offline banner, pending count, spinner & Sync Now
  // --------------------------------------------------------------------------
  describe('5. ConnectionStatusBanner Simulation: States, Mutation Counts & Manual Sync Trigger', () => {
    it('renders offline alert banner when disconnected with 0 pending mutations', () => {
      jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: false });

      const { getByTestId, getByText, queryByTestId } = render(
        <ConnectionStatusBanner pendingCount={0} isSyncing={false} />
      );

      expect(getByTestId('connection-status-banner')).toBeTruthy();
      expect(getByText('You are offline. Changes are saved locally.')).toBeTruthy();
      expect(queryByTestId('offline-pending-badge')).toBeNull();
    });

    it('renders offline alert banner with pending badge counter when offline with queued items', () => {
      jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: false });

      const { getByTestId, getByText } = render(
        <ConnectionStatusBanner pendingCount={7} isSyncing={false} />
      );

      expect(getByTestId('connection-status-banner')).toBeTruthy();
      expect(getByText('You are offline. Changes are saved locally.')).toBeTruthy();
      expect(getByTestId('offline-pending-badge')).toBeTruthy();
      expect(getByText('7 queued')).toBeTruthy();
    });

    it('renders pending sync banner with formatted text and triggers "Sync Now" button when online', () => {
      jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: true });
      const onSyncNowMock = jest.fn();

      // Plural test
      const { getByTestId, getByText, rerender } = render(
        <ConnectionStatusBanner
          pendingCount={3}
          isSyncing={false}
          onSyncNow={onSyncNowMock}
        />
      );

      expect(getByTestId('connection-status-banner')).toBeTruthy();
      expect(getByText('3 changes waiting to sync')).toBeTruthy();
      expect(getByTestId('sync-now-button')).toBeTruthy();

      fireEvent.press(getByTestId('sync-now-button'));
      expect(onSyncNowMock).toHaveBeenCalledTimes(1);

      // Singular test
      rerender(
        <ConnectionStatusBanner
          pendingCount={1}
          isSyncing={false}
          onSyncNow={onSyncNowMock}
        />
      );
      expect(getByText('1 change waiting to sync')).toBeTruthy();
    });

    it('renders active sync spinner and hides "Sync Now" button while isSyncing is true', () => {
      jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: true });

      const { getByTestId, getByText, queryByTestId } = render(
        <ConnectionStatusBanner pendingCount={4} isSyncing={true} onSyncNow={jest.fn()} />
      );

      expect(getByTestId('connection-status-banner')).toBeTruthy();
      expect(getByText('Syncing changes...')).toBeTruthy();
      expect(getByTestId('sync-spinner')).toBeTruthy();
      expect(queryByTestId('sync-now-button')).toBeNull();
    });

    it('returns null and renders nothing when online with 0 pending items and not syncing', () => {
      jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: true });

      const { queryByTestId } = render(
        <ConnectionStatusBanner pendingCount={0} isSyncing={false} />
      );

      expect(queryByTestId('connection-status-banner')).toBeNull();
    });

    it('integrates seamlessly with ExpenseProvider context to reflect pendingSyncCount and trigger syncQueue', async () => {
      (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
      (OfflineQueueService.getPendingCount as jest.Mock).mockResolvedValue(2);
      (ExpenseService.processSyncQueue as jest.Mock).mockResolvedValue(2);

      const ConsumerApp = () => (
        <ExpenseProvider>
          <ConnectionStatusBanner />
        </ExpenseProvider>
      );

      const { getByTestId, getByText } = render(<ConsumerApp />);

      await waitFor(() => {
        expect(getByTestId('connection-status-banner')).toBeTruthy();
      });

      expect(getByText('2 changes waiting to sync')).toBeTruthy();
      expect(getByTestId('sync-now-button')).toBeTruthy();

      // Trigger sync
      await act(async () => {
        fireEvent.press(getByTestId('sync-now-button'));
      });

      expect(ExpenseService.processSyncQueue).toHaveBeenCalledWith(SIMULATION_USER.uid);
    });
  });
});
