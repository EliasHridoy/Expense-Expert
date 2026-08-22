import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import NewExpenseScreen from '../../app/(app)/expenses/new';
import EditExpenseScreen from '../../app/(app)/expenses/[id]';
import AppDashboardScreen from '../../app/(app)/index';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useExpenses } from '../../src/features/expenses/hooks/useExpenses';
import { ExpenseCategory } from '../../src/features/expenses/types/category.types';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/features/expenses/hooks/useExpenses', () => ({
  useExpenses: jest.fn(),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => mockParams,
  useSegments: () => [],
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text testID="redirect-target">{href}</Text>;
  },
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    {
      Screen: () => null,
    }
  ),
}));

describe('Expense Routes & Screen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};

    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'user@example.com', displayName: 'Test User' },
      profile: { uid: 'user-1', email: 'user@example.com', displayName: 'Test User' },
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    (useExpenses as jest.Mock).mockReturnValue({
      expenses: [],
      pendingSyncCount: 0,
      isLoading: false,
      isSyncing: false,
      isOnline: true,
      addExpense: jest.fn().mockResolvedValue({ id: 'exp-123' }),
      updateExpense: jest.fn().mockResolvedValue(undefined),
      deleteExpense: jest.fn().mockResolvedValue(undefined),
      getExpenseById: jest.fn(),
      syncQueue: jest.fn().mockResolvedValue(0),
      refreshExpenses: jest.fn(),
    });
  });

  describe('NewExpenseScreen (app/(app)/expenses/new.tsx)', () => {
    it('renders new expense screen and form', () => {
      const { getByTestId, getByText } = render(<NewExpenseScreen />);

      expect(getByTestId('new-expense-screen')).toBeTruthy();
      expect(getByTestId('expense-form')).toBeTruthy();
      expect(getByText('Add Expense')).toBeTruthy();
    });

    it('navigates back when cancel is pressed', () => {
      const { getByTestId } = render(<NewExpenseScreen />);
      fireEvent.press(getByTestId('expense-cancel-btn'));
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('EditExpenseScreen (app/(app)/expenses/[id].tsx)', () => {
    it('renders not found state when expense does not exist', async () => {
      mockParams = { id: 'invalid-id' };
      const mockGetExpenseById = jest.fn().mockResolvedValue(undefined);
      (useExpenses as jest.Mock).mockReturnValue({
        ...((useExpenses as jest.Mock)()),
        getExpenseById: mockGetExpenseById,
      });

      const { getByTestId, getByText } = render(<EditExpenseScreen />);

      await waitFor(() => {
        expect(getByTestId('expense-not-found-card')).toBeTruthy();
        expect(getByText('Expense Not Found')).toBeTruthy();
      });

      fireEvent.press(getByTestId('not-found-back-btn'));
      expect(mockBack).toHaveBeenCalled();
    });

    it('loads and renders existing expense in edit mode', async () => {
      mockParams = { id: 'exp-101' };
      const mockExpense = {
        id: 'exp-101',
        userId: 'user-1',
        title: 'Weekly Grocery',
        description: 'Bought veggies and fruits',
        amount: 45.5,
        amountInCents: 4550,
        category: ExpenseCategory.Food,
        date: '2026-08-20T10:00:00.000Z',
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        syncStatus: 'synced' as const,
        createdAt: '2026-08-20T10:00:00.000Z',
        updatedAt: '2026-08-20T10:00:00.000Z',
      };

      const mockGetExpenseById = jest.fn().mockResolvedValue(mockExpense);
      (useExpenses as jest.Mock).mockReturnValue({
        ...((useExpenses as jest.Mock)()),
        getExpenseById: mockGetExpenseById,
      });

      const { getByTestId, getByText } = render(<EditExpenseScreen />);

      await waitFor(() => {
        expect(getByTestId('expense-form')).toBeTruthy();
        expect(getByText('Edit Expense')).toBeTruthy();
      });
    });
  });

  describe('AppDashboardScreen (app/(app)/index.tsx)', () => {
    it('renders empty state when there are no expenses', () => {
      const { getByTestId, getByText } = render(<AppDashboardScreen />);

      expect(getByTestId('empty-expenses-message')).toBeTruthy();
      expect(getByText('No expenses recorded yet')).toBeTruthy();
    });

    it('navigates to /expenses/new when Quick Add button is pressed', () => {
      const { getByTestId } = render(<AppDashboardScreen />);

      fireEvent.press(getByTestId('quick-add-expense-btn'));
      expect(mockPush).toHaveBeenCalledWith('/expenses/new');
    });

    it('renders offline sync banner when offline or pending items exist', () => {
      const mockSync = jest.fn();
      (useExpenses as jest.Mock).mockReturnValue({
        ...((useExpenses as jest.Mock)()),
        isOnline: false,
        pendingSyncCount: 3,
        syncQueue: mockSync,
      });

      const { getByTestId, getByText } = render(<AppDashboardScreen />);

      expect(getByTestId('offline-sync-banner')).toBeTruthy();
      expect(getByText('Offline Mode')).toBeTruthy();
      expect(getByText('3 transactions queued locally')).toBeTruthy();
    });

    it('renders list of expenses and navigates to edit screen on item press', () => {
      const mockExpenses = [
        {
          id: 'exp-1',
          userId: 'user-1',
          title: 'Morning Coffee',
          amount: 4.5,
          amountInCents: 450,
          category: ExpenseCategory.Food,
          date: '2026-08-21T08:30:00.000Z',
          month: '2026-08',
          syncStatus: 'synced' as const,
          createdAt: '2026-08-21T08:30:00.000Z',
          updatedAt: '2026-08-21T08:30:00.000Z',
        },
        {
          id: 'exp-2',
          userId: 'user-1',
          title: 'Train Ticket',
          amount: 15.0,
          amountInCents: 1500,
          category: ExpenseCategory.Transport,
          date: '2026-08-21T09:15:00.000Z',
          month: '2026-08',
          syncStatus: 'pending' as const,
          createdAt: '2026-08-21T09:15:00.000Z',
          updatedAt: '2026-08-21T09:15:00.000Z',
        },
      ];

      (useExpenses as jest.Mock).mockReturnValue({
        ...((useExpenses as jest.Mock)()),
        expenses: mockExpenses,
      });

      const { getByTestId, getByText } = render(<AppDashboardScreen />);

      expect(getByText('Morning Coffee')).toBeTruthy();
      expect(getByText('Train Ticket')).toBeTruthy();
      expect(getByText('$4.50')).toBeTruthy();
      expect(getByText('$15.00')).toBeTruthy();
      expect(getByTestId('expense-pending-badge-exp-2')).toBeTruthy();

      // Press item to navigate to details/edit
      fireEvent.press(getByTestId('expense-item-exp-1'));
      expect(mockPush).toHaveBeenCalledWith('/expenses/exp-1');
    });
  });
});
