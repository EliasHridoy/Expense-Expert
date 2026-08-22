import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ExpenseForm } from '../../../src/features/expenses/components/ExpenseForm';
import { useExpenses } from '../../../src/features/expenses/hooks/useExpenses';
import { ExpenseCategory } from '../../../src/features/expenses/types/category.types';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('../../../src/features/expenses/hooks/useExpenses', () => ({
  useExpenses: jest.fn(),
}));

describe('ExpenseForm', () => {
  const mockAddExpense = jest.fn();
  const mockUpdateExpense = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useExpenses as jest.Mock).mockReturnValue({
      expenses: [],
      pendingSyncCount: 0,
      isLoading: false,
      isSyncing: false,
      isOnline: true,
      addExpense: mockAddExpense,
      updateExpense: mockUpdateExpense,
      deleteExpense: jest.fn(),
      getExpenseById: jest.fn(),
      syncQueue: jest.fn(),
      refreshExpenses: jest.fn(),
    });
  });

  it('navigates through 3 steps with validation and submits new expense', async () => {
    const mockCreatedExpense = {
      id: 'exp_123456789',
      title: 'Grocery',
      amount: 45.5,
      amountInCents: 4550,
      category: ExpenseCategory.Food,
      date: '2026-08-23T00:00:00.000Z',
      month: '2026-08',
      description: 'Weekly whole foods shopping',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T00:00:00.000Z',
    };
    mockAddExpense.mockResolvedValueOnce(mockCreatedExpense);
    const onSuccess = jest.fn();

    const { getByTestId, queryByTestId, getByText } = render(
      <ExpenseForm onSuccess={onSuccess} />
    );

    // --- STEP 1: Amount & Category ---
    expect(getByTestId('expense-step-1')).toBeTruthy();
    expect(queryByTestId('expense-step-2')).toBeNull();
    expect(queryByTestId('expense-step-3')).toBeNull();

    const continueBtn = getByTestId('expense-continue-btn');
    expect(continueBtn.props.accessibilityState.disabled).toBe(true);

    // Enter valid amount
    const amountInput = getByTestId('expense-amount-input');
    fireEvent.changeText(amountInput, '45.50');

    // Select category (Food is default, select Transport then Food)
    fireEvent.press(getByTestId(`category-card-${ExpenseCategory.Transport}`));
    fireEvent.press(getByTestId(`category-card-${ExpenseCategory.Food}`));

    expect(continueBtn.props.accessibilityState.disabled).toBe(false);

    // Move to Step 2
    await act(async () => {
      fireEvent.press(continueBtn);
    });

    // --- STEP 2: Title & Date ---
    expect(queryByTestId('expense-step-1')).toBeNull();
    expect(getByTestId('expense-step-2')).toBeTruthy();

    const step2ContinueBtn = getByTestId('expense-continue-btn');
    expect(step2ContinueBtn.props.accessibilityState.disabled).toBe(true);

    // Test back button to Step 1
    const backBtn = getByTestId('expense-back-btn');
    await act(async () => {
      fireEvent.press(backBtn);
    });
    expect(getByTestId('expense-step-1')).toBeTruthy();

    // Go forward to Step 2 again
    await act(async () => {
      fireEvent.press(getByTestId('expense-continue-btn'));
    });
    expect(getByTestId('expense-step-2')).toBeTruthy();

    // Click suggestion pill 'Grocery'
    const groceryPill = getByTestId('suggestion-pill-Grocery');
    fireEvent.press(groceryPill);

    const titleInput = getByTestId('expense-title-input');
    expect(titleInput.props.value).toBe('Grocery');
    expect(getByTestId('expense-continue-btn').props.accessibilityState.disabled).toBe(false);

    // Move to Step 3
    await act(async () => {
      fireEvent.press(getByTestId('expense-continue-btn'));
    });

    // --- STEP 3: Details & Review Summary Card ---
    expect(getByTestId('expense-step-3')).toBeTruthy();
    expect(getByTestId('expense-summary-card')).toBeTruthy();
    expect(getByTestId('expense-summary-title').props.children).toBe('Grocery');
    expect(getByTestId('expense-summary-amount').props.children).toBe('$45.50');

    // Enter note description
    const descInput = getByTestId('expense-description-input');
    fireEvent.changeText(descInput, 'Weekly whole foods shopping');

    // Submit form
    const submitBtn = getByTestId('expense-submit-btn');
    expect(getByText('Save Expense')).toBeTruthy();

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Grocery',
          description: 'Weekly whole foods shopping',
          amount: 45.5,
          category: ExpenseCategory.Food,
          isLoan: false,
          loanPersonId: null,
        })
      );
      expect(onSuccess).toHaveBeenCalledWith(mockCreatedExpense);
    });
  });

  it('renders edit mode with pre-filled fields and calls updateExpense on submission', async () => {
    mockUpdateExpense.mockResolvedValueOnce(undefined);
    const onSuccess = jest.fn();

    const initialData = {
      id: 'exp_existing_999',
      title: 'Electricity Bill',
      amount: 120.0,
      amountInCents: 12000,
      category: ExpenseCategory.Utilities,
      date: '2026-08-15T00:00:00.000Z',
      description: 'July power bill',
      isLoan: false,
      loanPersonId: null,
    };

    const { getByTestId, getByText } = render(
      <ExpenseForm initialData={initialData} onSuccess={onSuccess} />
    );

    // Should display Edit Expense title
    expect(getByText('Edit Expense')).toBeTruthy();

    // Step 1: verify prefilled amount
    const amountInput = getByTestId('expense-amount-input');
    expect(amountInput.props.value).toBe('120');

    // Continue to Step 2
    await act(async () => {
      fireEvent.press(getByTestId('expense-continue-btn'));
    });

    // Step 2: verify prefilled title
    const titleInput = getByTestId('expense-title-input');
    expect(titleInput.props.value).toBe('Electricity Bill');

    // Change title
    fireEvent.changeText(titleInput, 'Electric Utility Bill');

    // Continue to Step 3
    await act(async () => {
      fireEvent.press(getByTestId('expense-continue-btn'));
    });

    // Step 3: verify prefilled description and summary
    expect(getByText('Update Expense')).toBeTruthy();
    expect(getByTestId('expense-summary-title').props.children).toBe('Electric Utility Bill');
    expect(getByTestId('expense-summary-amount').props.children).toBe('$120.00');

    // Submit update
    await act(async () => {
      fireEvent.press(getByTestId('expense-submit-btn'));
    });

    await waitFor(() => {
      expect(mockUpdateExpense).toHaveBeenCalledWith(
        'exp_existing_999',
        expect.objectContaining({
          title: 'Electric Utility Bill',
          amount: 120,
          category: ExpenseCategory.Utilities,
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles cancellation via onCancel callback or router.back', async () => {
    const onCancel = jest.fn();
    const { getByTestId, rerender } = render(<ExpenseForm onCancel={onCancel} />);

    fireEvent.press(getByTestId('expense-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(<ExpenseForm />);
    fireEvent.press(getByTestId('expense-cancel-btn'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('displays error message banner when submission fails', async () => {
    mockAddExpense.mockRejectedValueOnce(new Error('Network failure writing to Firestore'));

    const { getByTestId, findByText } = render(<ExpenseForm />);

    // Step 1
    fireEvent.changeText(getByTestId('expense-amount-input'), '10.00');
    fireEvent.press(getByTestId('expense-continue-btn'));

    // Step 2
    fireEvent.changeText(getByTestId('expense-title-input'), 'Coffee');
    fireEvent.press(getByTestId('expense-continue-btn'));

    // Step 3
    await act(async () => {
      fireEvent.press(getByTestId('expense-submit-btn'));
    });

    const errorText = await findByText('Network failure writing to Firestore');
    expect(errorText).toBeTruthy();
    expect(getByTestId('expense-form-error')).toBeTruthy();
  });
});
