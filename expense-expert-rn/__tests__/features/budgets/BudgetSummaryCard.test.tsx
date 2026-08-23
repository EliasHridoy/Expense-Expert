import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BudgetSummaryCard } from '../../../src/features/budgets/components/BudgetSummaryCard';
import { BudgetSummary } from '../../../src/features/budgets/types/budget.types';

describe('BudgetSummaryCard', () => {
  const mockSummary: BudgetSummary = {
    totalLimitInCents: 100000,
    totalLimit: 1000,
    totalSpentInCents: 65000,
    totalSpent: 650,
    totalRemainingInCents: 35000,
    totalRemaining: 350,
    percentage: 65,
    thresholdState: 'under',
  };

  const mockExceededSummary: BudgetSummary = {
    totalLimitInCents: 100000,
    totalLimit: 1000,
    totalSpentInCents: 115000,
    totalSpent: 1150,
    totalRemainingInCents: -15000,
    totalRemaining: -150,
    percentage: 115,
    thresholdState: 'exceeded',
  };

  it('renders total spending metrics, limit, and remaining balance', () => {
    const { getByTestId, getByText } = render(
      <BudgetSummaryCard summary={mockSummary} activeMonth="2026-08" />
    );

    expect(getByTestId('budget-summary-card')).toBeTruthy();
    expect(getByTestId('budget-summary-card-month')).toHaveTextContent('August 2026');
    expect(getByTestId('budget-summary-card-spent')).toHaveTextContent('$650.00');
    expect(getByTestId('budget-summary-card-limit')).toHaveTextContent('$1,000.00');
    expect(getByTestId('budget-summary-card-remaining')).toHaveTextContent('$350.00');
    expect(getByText('Remaining')).toBeTruthy();
  });

  it('renders exceeded summary with negative remaining balance and Over By label', () => {
    const { getByTestId, getByText } = render(
      <BudgetSummaryCard summary={mockExceededSummary} activeMonth="2026-08" />
    );

    expect(getByTestId('budget-summary-card-spent')).toHaveTextContent('$1,150.00');
    expect(getByTestId('budget-summary-card-remaining')).toHaveTextContent('-$150.00');
    expect(getByText('Over By')).toBeTruthy();
  });

  it('triggers onAddBudget callback when Set Budget button is clicked', () => {
    const onAddBudget = jest.fn();
    const { getByTestId } = render(
      <BudgetSummaryCard
        summary={mockSummary}
        activeMonth="2026-08"
        onAddBudget={onAddBudget}
      />
    );

    fireEvent.press(getByTestId('budget-summary-card-add-btn'));
    expect(onAddBudget).toHaveBeenCalledTimes(1);
  });
});
