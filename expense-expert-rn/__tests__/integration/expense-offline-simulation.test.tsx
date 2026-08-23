import React from 'react';
import { render, fireEvent, waitFor, act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import { ExpenseProvider } from '@/features/expenses/context/ExpenseProvider';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { ExpenseService } from '@/features/expenses/services/expense.service';
import {
  OfflineQueueService,
  QUEUE_STORAGE_KEY,
} from '@/features/expenses/services/offline-queue.service';
import {
  toCents,
  fromCents,
  addCents,
  subtractCents,
  multiplyCents,
  divideCents,
  formatCents,
} from '@/features/expenses/utils/currency.util';
import { ExpenseCategory } from '@/features/expenses/types/category.types';
import { Expense, CreateExpenseDto, QueuedMutation } from '@/features/expenses/types/expense.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNetworkStatus } from '@/features/expenses/hooks/useNetworkStatus';
import {
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

// --- MOCKS ---

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/expenses/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn((_db, path) => `mock-collection:${path}`),
    doc: jest.fn((_db, path, id) => `mock-doc:${path}/${id}`),
    setDoc: jest.fn().mockResolvedValue(undefined),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn((...args) => args),
    where: jest.fn((...args) => ({ type: 'where', args })),
    orderBy: jest.fn((...args) => ({ type: 'orderBy', args })),
    serverTimestamp: jest.fn(() => 'MOCK_SERVER_TIMESTAMP'),
    onSnapshot: jest.fn((_query, onNext) => {
      return jest.fn();
    }),
  };
});

jest.mock('@/config/firebase', () => ({
  db: { _mockDb: true },
}));

// --- DUMMY DATA FIXTURES ---

const SIMULATED_USER = {
  uid: 'usr_simulation_alpha_99',
  email: 'tester.alpha@expenseexpert.io',
  displayName: 'Simulation Alpha Tester',
};

const DUMMY_EXPENSE_ENTRIES: Array<{
  dto: CreateExpenseDto;
  expectedCents: number;
  expectedAmount: number;
}> = [
  {
    dto: {
      title: 'Whole Foods Market Organics',
      description: 'Weekly organic produce & milk',
      amount: '124.755', // fractional dollar value -> should round to 12476 cents ($124.76)
      category: ExpenseCategory.Food,
      date: '2026-08-20T10:30:00.000Z',
    },
    expectedCents: 12476,
    expectedAmount: 124.76,
  },
  {
    dto: {
      title: 'Metro Rapid Transit Monthly Pass',
      description: 'Zone 1-3 public transport pass',
      amount: '85.00',
      category: ExpenseCategory.Transport,
      date: '2026-08-21T08:15:00.000Z',
    },
    expectedCents: 8500,
    expectedAmount: 85.0,
  },
  {
    dto: {
      title: 'Cloud Server Infrastructure',
      description: 'Monthly VPS hosting charges',
      amount: 19.99,
      category: ExpenseCategory.Utilities,
      date: '2026-08-22T00:00:00.000Z',
    },
    expectedCents: 1999,
    expectedAmount: 19.99,
  },
  {
    dto: {
      title: 'Cinema IMAX Ticket & Popcorn',
      description: 'Weekend premiere tickets',
      amount: '$34.505', // formatted string with 3 decimals -> 3451 cents
      category: ExpenseCategory.Entertainment,
      date: '2026-08-22T19:45:00.000Z',
    },
    expectedCents: 3451,
    expectedAmount: 34.51,
  },
  {
    dto: {
      title: 'Micro Espresso Subscription',
      description: 'Single origin bean delivery',
      amount: 12.345, // $12.345 -> 1235 cents
      category: ExpenseCategory.Food,
      date: '2026-08-23T07:30:00.000Z',
    },
    expectedCents: 1235,
    expectedAmount: 12.35,
  },
  {
    dto: {
      title: 'Emergency Peer Loan to Bob',
      description: 'Short term loan repayment expected next week',
      amount: '250.00',
      category: ExpenseCategory.Other,
      date: '2026-08-23T12:00:00.000Z',
      isLoan: true,
      loanPersonId: 'person_bob_42',
    },
    expectedCents: 25000,
    expectedAmount: 250.0,
  },
];

describe('Expense & Offline Queue Module - End-to-End Simulation Test Suite', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();

    (useAuth as jest.Mock).mockReturnValue({
      user: SIMULATED_USER,
      isAuthenticated: true,
    });

    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: true,
      isInternetReachable: true,
    });

    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  // =========================================================================
  // SCENARIO 1: Full Expense Entry Form Flow Integration
  // =========================================================================
  describe('1. Full Expense Entry Form Flow Simulation (Step 1 -> Step 2 -> Step 3)', () => {
    const renderExpenseFormWithProvider = (
      initialData?: Partial<Expense>,
      onSuccess?: (expense: Expense) => void
    ) => {
      return render(
        <ExpenseProvider>
          <ExpenseForm initialData={initialData} onSuccess={onSuccess} />
        </ExpenseProvider>
      );
    };

    it('completes the entire 3-step wizard workflow and persists new expense via ExpenseProvider', async () => {
      const onSuccessMock = jest.fn();
      const { getByTestId, queryByTestId, getByText } = renderExpenseFormWithProvider(
        undefined,
        onSuccessMock
      );

      // --- STEP 1: Amount & Category ---
      expect(getByTestId('expense-step-1')).toBeTruthy();
      expect(queryByTestId('expense-step-2')).toBeNull();
      expect(queryByTestId('expense-step-3')).toBeNull();

      // Continue button must be disabled initially (amount is empty/0)
      const continueBtnStep1 = getByTestId('expense-continue-btn');
      expect(continueBtnStep1.props.accessibilityState.disabled).toBe(true);

      // Input amount
      const amountInput = getByTestId('expense-amount-input');
      fireEvent.changeText(amountInput, '64.85');

      // Select category (switch from default Food to Transport)
      const transportCard = getByTestId(`category-card-${ExpenseCategory.Transport}`);
      fireEvent.press(transportCard);
      expect(transportCard.props.accessibilityState.selected).toBe(true);

      // Now Step 1 should allow continuing
      expect(continueBtnStep1.props.accessibilityState.disabled).toBe(false);

      await act(async () => {
        fireEvent.press(continueBtnStep1);
      });

      // --- STEP 2: Title & Date ---
      expect(queryByTestId('expense-step-1')).toBeNull();
      expect(getByTestId('expense-step-2')).toBeTruthy();
      expect(queryByTestId('expense-step-3')).toBeNull();

      const continueBtnStep2 = getByTestId('expense-continue-btn');
      expect(continueBtnStep2.props.accessibilityState.disabled).toBe(true);

      // Test Suggestion Pill
      const transportPill = getByTestId('suggestion-pill-Transport');
      fireEvent.press(transportPill);

      const titleInput = getByTestId('expense-title-input');
      expect(titleInput.props.value).toBe('Transport');

      // Customize title
      fireEvent.changeText(titleInput, 'Monthly Train Pass & Shuttle');

      // Test Date Selector quick-button (Yesterday)
      const yesterdayBtn = getByTestId('expense-date-selector-yesterday-btn');
      fireEvent.press(yesterdayBtn);

      // Test Back Navigation to Step 1 and back to Step 2 (State preservation)
      const backBtn = getByTestId('expense-back-btn');
      await act(async () => {
        fireEvent.press(backBtn);
      });
      expect(getByTestId('expense-step-1')).toBeTruthy();
      expect(getByTestId('expense-amount-input').props.value).toBe('64.85');

      // Advance to Step 2 again
      await act(async () => {
        fireEvent.press(getByTestId('expense-continue-btn'));
      });
      expect(getByTestId('expense-step-2')).toBeTruthy();
      expect(getByTestId('expense-title-input').props.value).toBe(
        'Monthly Train Pass & Shuttle'
      );

      // Advance to Step 3
      expect(continueBtnStep2.props.accessibilityState.disabled).toBe(false);
      await act(async () => {
        fireEvent.press(continueBtnStep2);
      });

      // --- STEP 3: Details & Summary ---
      expect(getByTestId('expense-step-3')).toBeTruthy();
      expect(getByTestId('expense-summary-card')).toBeTruthy();

      // Verify Summary Card shows accurate details
      expect(getByTestId('expense-summary-title').props.children).toBe(
        'Monthly Train Pass & Shuttle'
      );
      expect(getByTestId('expense-summary-amount').props.children).toBe('$64.85');

      // Enter optional description note
      const descriptionInput = getByTestId('expense-description-input');
      fireEvent.changeText(
        descriptionInput,
        'Commuter card renewed at central station'
      );

      // Submit Form
      const submitBtn = getByTestId('expense-submit-btn');
      expect(getByText('Save Expense')).toBeTruthy();

      await act(async () => {
        fireEvent.press(submitBtn);
      });

      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
      });

      const createdExpense: Expense = onSuccessMock.mock.calls[0][0];
      expect(createdExpense.id).toMatch(/^exp_\d+_[a-z0-9]+$/);
      expect(createdExpense.title).toBe('Monthly Train Pass & Shuttle');
      expect(createdExpense.description).toBe(
        'Commuter card renewed at central station'
      );
      expect(createdExpense.amount).toBe(64.85);
      expect(createdExpense.amountInCents).toBe(6485);
      expect(createdExpense.category).toBe(ExpenseCategory.Transport);
      expect(createdExpense.syncStatus).toBe('synced');
      expect(setDoc).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // SCENARIO 2: Safe Integer-Cents Financial Math & Zero Floating-Point Drift
  // =========================================================================
  describe('2. Safe Integer-Cents Math with Fractional Values Simulation', () => {
    it('accurately converts fractional dollar values into exact integer cents with strict rounding ($12.345 -> 1235 cents)', () => {
      const cases = [
        { input: 12.345, expected: 1235 },
        { input: '12.345', expected: 1235 },
        { input: '$12.345', expected: 1235 },
        { input: 0.005, expected: 1 },
        { input: '0.005', expected: 1 },
        { input: 0.004, expected: 0 },
        { input: '0.004', expected: 0 },
        { input: 99.999, expected: 10000 },
        { input: '$99.999', expected: 10000 },
        { input: '1,250.678', expected: 125068 },
        { input: '$1,250.678', expected: 125068 },
        { input: -10.555, expected: -1056 },
        { input: '-$10.555', expected: -1056 },
        { input: '($25.125)', expected: -2513 },
        { input: null, expected: 0 },
        { input: undefined, expected: 0 },
        { input: '', expected: 0 },
        { input: 'invalid-string', expected: 0 },
      ];

      cases.forEach(({ input, expected }) => {
        const cents = toCents(input as any);
        expect(cents).toBe(expected);
      });
    });

    it('demonstrates zero IEEE 754 floating-point drift across 1,000 fractional micro-transactions', () => {
      let rawFloatSum = 0;
      let safeCentsSum = 0;

      const transactionAmounts = [0.1, 0.2, 0.335, 12.345, 0.01, 19.99];

      for (let i = 0; i < 1000; i++) {
        const amt = transactionAmounts[i % transactionAmounts.length];
        rawFloatSum += amt;
        safeCentsSum = addCents(safeCentsSum, toCents(amt));
      }

      const finalDollarFromCents = fromCents(safeCentsSum);

      expect(Number.isInteger(safeCentsSum)).toBe(true);
      expect(safeCentsSum).toBe(548933);
      expect(finalDollarFromCents).toBe(5489.33);
      expect(formatCents(safeCentsSum)).toBe('$5,489.33');

      expect(subtractCents(safeCentsSum, 10000)).toBe(538933);
      expect(multiplyCents(1235, 3)).toBe(3705);
      expect(divideCents(10000, 3)).toBe(3333);
    });

    it('processes all dummy fixture expenses through ExpenseService ensuring exact integer-cents conversion', async () => {
      for (const item of DUMMY_EXPENSE_ENTRIES) {
        const created = await ExpenseService.addExpense(
          SIMULATED_USER.uid,
          item.dto,
          true
        );

        expect(created.amountInCents).toBe(item.expectedCents);
        expect(created.amount).toBe(item.expectedAmount);
        expect(created.syncStatus).toBe('synced');
      }

      expect(setDoc).toHaveBeenCalledTimes(DUMMY_EXPENSE_ENTRIES.length);
    });
  });

  // =========================================================================
  // SCENARIO 3: Offline Expense Creation & Durable AsyncStorage Queueing
  // =========================================================================
  describe('3. Offline Expense Creation Queued in AsyncStorage (OfflineQueueService)', () => {
    it('creates expense offline with temporary client UUID, syncStatus="pending", and enqueues to AsyncStorage', async () => {
      const offlineExpenseDto: CreateExpenseDto = {
        title: 'Offline Subway Sandwich',
        description: 'Bought during airplane mode / offline commute',
        amount: '12.345',
        category: ExpenseCategory.Food,
        date: '2026-08-23T11:00:00.000Z',
      };

      const created = await ExpenseService.addExpense(
        SIMULATED_USER.uid,
        offlineExpenseDto,
        false
      );

      expect(created.id).toMatch(/^exp_\d+_[a-z0-9]+$/);
      expect(created.syncStatus).toBe('pending');
      expect(created.amountInCents).toBe(1235);
      expect(created.amount).toBe(12.35);

      expect(setDoc).not.toHaveBeenCalled();

      const queueRaw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      expect(queueRaw).toBeTruthy();

      const queue: QueuedMutation[] = JSON.parse(queueRaw!);
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toMatch(/^mut_\d+_[a-z0-9]+$/);
      expect(queue[0].type).toBe('CREATE_EXPENSE');
      expect(queue[0].userId).toBe(SIMULATED_USER.uid);
      expect(queue[0].expenseId).toBe(created.id);
      expect(queue[0].retryCount).toBe(0);
      expect(queue[0].payload.title).toBe('Offline Subway Sandwich');
      expect(queue[0].payload.amountInCents).toBe(1235);

      const pendingCount = await OfflineQueueService.getPendingCount(SIMULATED_USER.uid);
      expect(pendingCount).toBe(1);
    });

    it('maintains sequential FIFO queue across multiple offline operations (CREATE, UPDATE, DELETE)', async () => {
      const exp1 = await ExpenseService.addExpense(
        SIMULATED_USER.uid,
        {
          title: 'Offline Taxi Fare',
          amount: 25.5,
          category: ExpenseCategory.Transport,
          date: '2026-08-23T08:00:00.000Z',
        },
        false
      );

      const exp2 = await ExpenseService.addExpense(
        SIMULATED_USER.uid,
        {
          title: 'Offline Grocery Basket',
          amount: '75.25',
          category: ExpenseCategory.Food,
          date: '2026-08-23T09:00:00.000Z',
        },
        false
      );

      const exp3 = await ExpenseService.addExpense(
        SIMULATED_USER.uid,
        {
          title: 'Offline Hardware Store',
          amount: 49.99,
          category: ExpenseCategory.Other,
          date: '2026-08-23T10:00:00.000Z',
        },
        false
      );

      await ExpenseService.updateExpense(
        SIMULATED_USER.uid,
        exp1.id,
        { title: 'Offline Taxi Fare (Updated with Tip)', amount: 30.0 },
        false
      );

      await ExpenseService.deleteExpense(SIMULATED_USER.uid, exp2.id, false);

      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(5);

      expect(queue[0].type).toBe('CREATE_EXPENSE');
      expect(queue[0].expenseId).toBe(exp1.id);

      expect(queue[1].type).toBe('CREATE_EXPENSE');
      expect(queue[1].expenseId).toBe(exp2.id);

      expect(queue[2].type).toBe('CREATE_EXPENSE');
      expect(queue[2].expenseId).toBe(exp3.id);

      expect(queue[3].type).toBe('UPDATE_EXPENSE');
      expect(queue[3].expenseId).toBe(exp1.id);
      expect(queue[3].payload.title).toBe('Offline Taxi Fare (Updated with Tip)');
      expect(queue[3].payload.amountInCents).toBe(3000);

      expect(queue[4].type).toBe('DELETE_EXPENSE');
      expect(queue[4].expenseId).toBe(exp2.id);
    });

    it('falls back to offline queue if online Firestore call throws a network error', async () => {
      (setDoc as jest.Mock).mockRejectedValueOnce(
        new Error('UNAVAILABLE: network connection dropped unexpectedly')
      );

      const result = await ExpenseService.addExpense(
        SIMULATED_USER.uid,
        {
          title: 'Transient Failure Coffee',
          amount: 4.5,
          category: ExpenseCategory.Food,
          date: '2026-08-23T12:00:00.000Z',
        },
        true
      );

      expect(result.syncStatus).toBe('pending');
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].payload.title).toBe('Transient Failure Coffee');
    });
  });

  // =========================================================================
  // SCENARIO 4: Network Reconnection & Idempotent FIFO Queue Drainage Simulation
  // =========================================================================
  describe('4. Network Reconnection & Idempotent FIFO Queue Drainage Simulation', () => {
    it('drains queue sequentially in FIFO order, calls idempotent setDoc with merge:true, and clears AsyncStorage', async () => {
      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: 'exp_sim_001',
        payload: {
          id: 'exp_sim_001',
          title: 'Coffee at Station',
          amount: 4.5,
          amountInCents: 450,
          category: ExpenseCategory.Food,
          date: '2026-08-23T08:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          loanPersonId: null,
          loanCleared: false,
          loanRepaid: 0,
          loanTakenId: null,
          draftId: null,
          installmentIndex: null,
          createdAt: '2026-08-23T08:00:00.000Z',
          updatedAt: '2026-08-23T08:00:00.000Z',
          syncStatus: 'pending',
        },
      });

      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: 'exp_sim_002',
        payload: {
          id: 'exp_sim_002',
          title: 'Office Stationary',
          amount: 22.15,
          amountInCents: 2215,
          category: ExpenseCategory.Other,
          date: '2026-08-23T09:00:00.000Z',
          month: '2026-08',
          isLoan: false,
          createdAt: '2026-08-23T09:00:00.000Z',
          updatedAt: '2026-08-23T09:00:00.000Z',
          syncStatus: 'pending',
        },
      });

      await OfflineQueueService.enqueue({
        type: 'UPDATE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: 'exp_sim_001',
        payload: {
          title: 'Coffee at Station (Large + Donut)',
          amount: 7.25,
          amountInCents: 725,
        },
      });

      await OfflineQueueService.enqueue({
        type: 'DELETE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: 'exp_sim_002',
        payload: { id: 'exp_sim_002' },
      });

      expect(await OfflineQueueService.getPendingCount(SIMULATED_USER.uid)).toBe(4);

      const callLog: string[] = [];

      (setDoc as jest.Mock).mockImplementation(async (_docRef, data, options) => {
        callLog.push(`setDoc:${data.title || 'no-title'}:merge=${options?.merge}`);
      });

      (deleteDoc as jest.Mock).mockImplementation(async () => {
        callLog.push('deleteDoc');
      });

      const syncedCount = await ExpenseService.processSyncQueue(SIMULATED_USER.uid);

      expect(syncedCount).toBe(4);

      expect(callLog).toEqual([
        'setDoc:Coffee at Station:merge=true',
        'setDoc:Office Stationary:merge=true',
        'setDoc:Coffee at Station (Large + Donut):merge=true',
        'deleteDoc',
      ]);

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          updatedAt: 'MOCK_SERVER_TIMESTAMP',
        }),
        { merge: true }
      );

      const setDocCalls = (setDoc as jest.Mock).mock.calls;
      for (const call of setDocCalls) {
        expect(call[1].syncStatus).toBeUndefined();
      }

      const remainingQueue = await OfflineQueueService.getQueue();
      expect(remainingQueue).toEqual([]);
      expect(await OfflineQueueService.getPendingCount(SIMULATED_USER.uid)).toBe(0);
    });

    it('handles mid-drain network disconnection safely without data loss or queue corruption', async () => {
      const m1 = await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: 'exp_fail_1',
        payload: { title: 'First Item' },
      });

      const m2 = await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: 'exp_fail_2',
        payload: { title: 'Second Failing Item' },
      });

      const m3 = await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: 'exp_fail_3',
        payload: { title: 'Third Item Waiting' },
      });

      (setDoc as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Connection timed out'));

      const syncedCount = await ExpenseService.processSyncQueue(SIMULATED_USER.uid);

      expect(syncedCount).toBe(1);

      const queueAfterFailure = await OfflineQueueService.getQueue();
      expect(queueAfterFailure).toHaveLength(2);

      expect(queueAfterFailure.find((item) => item.id === m1.id)).toBeUndefined();

      const failingItem = queueAfterFailure.find((item) => item.id === m2.id);
      expect(failingItem).toBeDefined();
      expect(failingItem?.retryCount).toBe(1);
      expect(failingItem?.lastError).toBe('Connection timed out');

      const waitingItem = queueAfterFailure.find((item) => item.id === m3.id);
      expect(waitingItem).toBeDefined();
      expect(waitingItem?.retryCount).toBe(0);

      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const secondSyncCount = await ExpenseService.processSyncQueue(SIMULATED_USER.uid);
      expect(secondSyncCount).toBe(2);

      const finalQueue = await OfflineQueueService.getQueue();
      expect(finalQueue).toEqual([]);
    });

    it('ensures idempotent re-execution does not produce duplicate documents or corrupt records', async () => {
      const fixedExpenseId = 'exp_idempotent_fixed_777';

      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: fixedExpenseId,
        payload: {
          id: fixedExpenseId,
          title: 'Idempotent Test',
          amount: 50.0,
          amountInCents: 5000,
          category: ExpenseCategory.Utilities,
        },
      });

      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: SIMULATED_USER.uid,
        expenseId: fixedExpenseId,
        payload: {
          id: fixedExpenseId,
          title: 'Idempotent Test',
          amount: 50.0,
          amountInCents: 5000,
          category: ExpenseCategory.Utilities,
        },
      });

      const synced = await ExpenseService.processSyncQueue(SIMULATED_USER.uid);
      expect(synced).toBe(2);

      expect(setDoc).toHaveBeenCalledTimes(2);
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        `users/${SIMULATED_USER.uid}/expenses`,
        fixedExpenseId
      );

      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(0);
    });
  });

  // =========================================================================
  // SCENARIO 5: End-to-End Context Integration (Offline -> Online Transition)
  // =========================================================================
  describe('5. End-to-End Hybrid Lifecycle Simulation (Form -> Offline Queue -> Reconnection)', () => {
    it('seamlessly transitions from offline entry in UI to automatic synchronization on reconnect', async () => {
      let networkStatus = { isOnline: false, isInternetReachable: false };
      (useNetworkStatus as jest.Mock).mockImplementation(() => networkStatus);

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <ExpenseProvider>{children}</ExpenseProvider>
      );

      const { result, rerender } = renderHook(() => useExpenses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let offlineCreated: Expense;
      await act(async () => {
        offlineCreated = await result.current.addExpense({
          title: 'Offline Airport Coffee',
          amount: '7.855',
          category: ExpenseCategory.Food,
          date: '2026-08-23T14:00:00.000Z',
        });
      });

      expect(offlineCreated!.syncStatus).toBe('pending');
      expect(offlineCreated!.amountInCents).toBe(786);
      expect(result.current.expenses).toContainEqual(offlineCreated!);
      expect(result.current.pendingSyncCount).toBe(1);

      expect(await OfflineQueueService.getPendingCount(SIMULATED_USER.uid)).toBe(1);

      networkStatus = { isOnline: true, isInternetReachable: true };
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [
          {
            id: offlineCreated!.id,
            data: () => ({
              title: 'Offline Airport Coffee',
              amount: 7.86,
              amountInCents: 786,
              category: ExpenseCategory.Food,
              date: '2026-08-23T14:00:00.000Z',
              month: '2026-08',
              isLoan: false,
              createdAt: '2026-08-23T14:00:00.000Z',
              updatedAt: '2026-08-23T14:00:00.000Z',
            }),
          },
        ],
      });

      await act(async () => {
        rerender(undefined);
      });

      await waitFor(() => {
        expect(setDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            title: 'Offline Airport Coffee',
            amountInCents: 786,
          }),
          { merge: true }
        );
      });

      await waitFor(async () => {
        const count = await OfflineQueueService.getPendingCount(SIMULATED_USER.uid);
        expect(count).toBe(0);
      });
    });
  });
});
