import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SetBudgetModal } from '../../../src/features/budgets/components/SetBudgetModal';
import { useCategories } from '../../../src/features/categories/hooks/useCategories';

jest.mock('../../../src/features/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

describe('SetBudgetModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCategories as jest.Mock).mockReturnValue({
      categories: [
        { value: 'food', label: 'Food', icon: '🍔', isCustom: false },
        { value: 'transport', label: 'Transport', icon: '🚌', isCustom: false },
      ],
      customCategories: [],
    });
  });

  it('renders modal with target month and category selector', () => {
    const { getByTestId, getByText } = render(
      <SetBudgetModal
        visible={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
        activeMonth="2026-08"
      />
    );

    expect(getByTestId('set-budget-modal')).toBeTruthy();
    expect(getByText('Set Category Budget')).toBeTruthy();
    expect(getByText('2026-08')).toBeTruthy();
  });

  it('validates amount input when saving without valid amount', async () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(
      <SetBudgetModal
        visible={true}
        onClose={jest.fn()}
        onSave={onSave}
        activeMonth="2026-08"
      />
    );

    fireEvent.press(getByTestId('save-budget-btn'));

    expect(getByText('Please enter a budget limit greater than $0.00')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with category, activeMonth, and limit', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { getByTestId } = render(
      <SetBudgetModal
        visible={true}
        onClose={onClose}
        onSave={onSave}
        activeMonth="2026-08"
      />
    );

    // Enter limit amount in AmountInput
    fireEvent.changeText(getByTestId('budget-limit-input'), '450.00');

    // Select category 'transport'
    fireEvent.press(getByTestId('category-card-transport'));

    // Save
    fireEvent.press(getByTestId('save-budget-btn'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        category: 'transport',
        month: '2026-08',
        limit: '450.00',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('populates fields when initialBudget is provided for editing', () => {
    const { getByText, getByTestId } = render(
      <SetBudgetModal
        visible={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
        activeMonth="2026-08"
        initialBudget={{ category: 'transport', limit: 250, month: '2026-08' }}
      />
    );

    expect(getByText('Edit Category Budget')).toBeTruthy();
    expect(getByTestId('budget-limit-input').props.value).toBe('250');
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <SetBudgetModal
        visible={true}
        onClose={onClose}
        onSave={jest.fn()}
        activeMonth="2026-08"
      />
    );

    fireEvent.press(getByTestId('close-budget-modal-btn'));
    expect(onClose).toHaveBeenCalled();
  });
});
