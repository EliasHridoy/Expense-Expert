import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SavingsScreen from '@/../app/(app)/savings/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockAddGoal = jest.fn();
const mockAddBankAccount = jest.fn();
const mockAddEntry = jest.fn();
const mockDeleteGoal = jest.fn();

jest.mock('@/features/savings/hooks/useSavings', () => ({
  useSavings: () => ({
    bankAccounts: [
      { id: 'bank_1', bankName: 'Chase Bank', accountName: 'High-Yield Stash', accountNumber: '9876' },
    ],
    goals: [
      {
        id: 'goal_1',
        purpose: 'Emergency Fund',
        targetAmount: 5000,
        savedAmount: 2500,
        durationValue: 6,
        durationUnit: 'months',
        startMonth: '2026-06',
        endMonth: '2026-11',
        bankAccountId: 'bank_1',
      },
    ],
    entries: [
      {
        id: 'entry_1',
        goalId: 'goal_1',
        amount: 500,
        type: 'deposit',
        date: '2026-08-15',
        month: '2026-08',
        note: 'Monthly deposit',
      },
    ],
    isLoading: false,
    activeMonth: '2026-08',
    setActiveMonth: jest.fn(),
    addBankAccount: mockAddBankAccount,
    deleteBankAccount: jest.fn(),
    addGoal: mockAddGoal,
    updateGoal: jest.fn(),
    deleteGoal: mockDeleteGoal,
    addEntry: mockAddEntry,
  }),
}));

describe('SavingsScreen (/savings)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Savings screen with overview and bank accounts', () => {
    const { getByTestId, getByText } = render(<SavingsScreen />);
    expect(getByTestId('savings-screen')).toBeTruthy();
    expect(getByText('🏦 Savings & Goals')).toBeTruthy();
    expect(getByTestId('total-saved-amount')).toHaveTextContent('$2,500.00');
    expect(getByText('Chase Bank')).toBeTruthy();
  });

  it('displays saving goal card with 50% progress', () => {
    const { getByTestId, getAllByText, getByText } = render(<SavingsScreen />);
    expect(getByTestId('saving-goal-goal_1')).toBeTruthy();
    expect(getAllByText('Emergency Fund').length).toBeGreaterThanOrEqual(1);
    expect(getByText('50%')).toBeTruthy();
  });

  it('opens quick deposit modal and records saving entry', async () => {
    const { getByTestId } = render(<SavingsScreen />);

    // Click Deposit on goal
    fireEvent.press(getByTestId('deposit-btn-goal_1'));
    expect(getByTestId('quick-save-modal')).toBeTruthy();

    fireEvent.changeText(getByTestId('saving-amount-input'), '300.00');
    fireEvent.press(getByTestId('confirm-save-btn'));

    await waitFor(() => {
      expect(mockAddEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: 'goal_1',
          amount: 300,
          type: 'deposit',
        })
      );
    });
  });

  it('opens add saving goal modal and creates a new goal', async () => {
    const { getByTestId } = render(<SavingsScreen />);

    fireEvent.press(getByTestId('add-saving-goal-btn'));
    expect(getByTestId('add-goal-modal')).toBeTruthy();

    fireEvent.changeText(getByTestId('goal-purpose-input'), 'Japan Trip');
    fireEvent.changeText(getByTestId('goal-target-input'), '3000.00');
    fireEvent.press(getByTestId('submit-goal-btn'));

    await waitFor(() => {
      expect(mockAddGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          purpose: 'Japan Trip',
          targetAmount: 3000,
        })
      );
    });
  });
});
