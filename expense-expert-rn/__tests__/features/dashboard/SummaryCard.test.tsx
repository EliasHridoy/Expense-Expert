import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SummaryCard } from '../../../src/features/dashboard/components/SummaryCard';
import { SummaryCardsGrid } from '../../../src/features/dashboard/components/SummaryCardsGrid';
import { MonthSummary } from '../../../src/features/dashboard/types/dashboard.types';

describe('SummaryCard', () => {
  it('renders title, formatted amount, icon, and subtext correctly', () => {
    const { getByTestId, getByText } = render(
      <SummaryCard
        title="Total Income"
        amountFormatted="$5,000.00"
        icon="💰"
        type="income"
        subtext="Monthly income total"
        testID="custom-income-card"
      />
    );

    expect(getByTestId('custom-income-card')).toBeTruthy();
    expect(getByTestId('custom-income-card-title')).toHaveTextContent('Total Income');
    expect(getByTestId('custom-income-card-amount')).toHaveTextContent('$5,000.00');
    expect(getByTestId('custom-income-card-icon')).toBeTruthy();
    expect(getByTestId('custom-income-card-subtext')).toHaveTextContent('Monthly income total');
    expect(getByText('💰')).toBeTruthy();
  });

  it('renders badge text when badgeText is provided', () => {
    const { getByTestId } = render(
      <SummaryCard
        title="Net Remaining"
        amountFormatted="$1,250.00"
        badgeText="+12%"
        testID="badge-card"
      />
    );

    expect(getByTestId('badge-card-badge')).toHaveTextContent('+12%');
  });

  it('handles press events when onPress is provided', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <SummaryCard
        title="Total Expenses"
        amountFormatted="$2,000.00"
        onPress={onPressMock}
        testID="pressable-card"
      />
    );

    fireEvent.press(getByTestId('pressable-card'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders negative styling when isNegative is true', () => {
    const { getByTestId } = render(
      <SummaryCard
        title="Net Remaining"
        amountFormatted="-$450.00"
        isNegative={true}
        type="expense"
        testID="deficit-card"
      />
    );

    const amountElement = getByTestId('deficit-card-amount');
    expect(amountElement).toHaveTextContent('-$450.00');
    expect(amountElement.props.className).toContain('text-rose-600');
  });
});

describe('SummaryCardsGrid', () => {
  const mockSummary: MonthSummary = {
    month: '2026-08',
    totalIncomeInCents: 500000,
    totalIncome: 5000,
    currentMonthIncomeInCents: 450000,
    currentMonthIncome: 4500,
    previousMonthRemainingInCents: 50000,
    previousMonthRemaining: 500,
    totalExpensesInCents: 200000,
    totalExpenses: 2000,
    totalSavingsInCents: 100000,
    totalSavings: 1000,
    remainingInCents: 200000,
    remaining: 2000,
    loansTakenIncomeInCents: 0,
    loansTakenIncome: 0,
    expenseCount: 15,
  };

  const mockDeficitSummary: MonthSummary = {
    month: '2026-08',
    totalIncomeInCents: 300000,
    totalIncome: 3000,
    currentMonthIncomeInCents: 300000,
    currentMonthIncome: 3000,
    previousMonthRemainingInCents: 0,
    previousMonthRemaining: 0,
    totalExpensesInCents: 350000,
    totalExpenses: 3500,
    totalSavingsInCents: 50000,
    totalSavings: 500,
    remainingInCents: -100000,
    remaining: -1000,
    loansTakenIncomeInCents: 80000,
    loansTakenIncome: 800,
    expenseCount: 22,
  };

  it('renders all 4 standard metric cards with positive balance and carryover subtext', () => {
    const { getByTestId, queryByTestId } = render(
      <SummaryCardsGrid summary={mockSummary} />
    );

    // Total Income
    expect(getByTestId('summary-card-income-amount')).toHaveTextContent('$5,000.00');
    expect(getByTestId('summary-card-income-subtext')).toHaveTextContent('Includes +$500.00 carryover');

    // Total Expenses
    expect(getByTestId('summary-card-expenses-amount')).toHaveTextContent('$2,000.00');
    expect(getByTestId('summary-card-expenses-subtext')).toHaveTextContent('15 transactions');

    // Total Savings
    expect(getByTestId('summary-card-savings-amount')).toHaveTextContent('$1,000.00');
    expect(getByTestId('summary-card-savings-subtext')).toHaveTextContent('Net deposits this month');

    // Net Remaining (Surplus)
    expect(getByTestId('summary-card-remaining-amount')).toHaveTextContent('$2,000.00');
    expect(getByTestId('summary-card-remaining-subtext')).toHaveTextContent('Surplus balance');

    // Loans Taken should not be rendered when 0
    expect(queryByTestId('summary-card-loans')).toBeNull();
  });

  it('renders deficit Net Remaining and conditionally renders Loans Taken card when > 0', () => {
    const { getByTestId } = render(
      <SummaryCardsGrid summary={mockDeficitSummary} />
    );

    // Deficit Net Remaining
    expect(getByTestId('summary-card-remaining-amount')).toHaveTextContent('-$1,000.00');
    expect(getByTestId('summary-card-remaining-subtext')).toHaveTextContent('Deficit this month');

    // Loans Taken card should appear
    expect(getByTestId('summary-card-loans')).toBeTruthy();
    expect(getByTestId('summary-card-loans-amount')).toHaveTextContent('$800.00');
    expect(getByTestId('summary-card-loans-subtext')).toHaveTextContent('Inflow from loans');
  });

  it('triggers onPressCard callback when any card is clicked', () => {
    const onPressCard = jest.fn();
    const { getByTestId } = render(
      <SummaryCardsGrid summary={mockDeficitSummary} onPressCard={onPressCard} />
    );

    fireEvent.press(getByTestId('summary-card-income'));
    expect(onPressCard).toHaveBeenCalledWith('income');

    fireEvent.press(getByTestId('summary-card-expenses'));
    expect(onPressCard).toHaveBeenCalledWith('expenses');

    fireEvent.press(getByTestId('summary-card-savings'));
    expect(onPressCard).toHaveBeenCalledWith('savings');

    fireEvent.press(getByTestId('summary-card-remaining'));
    expect(onPressCard).toHaveBeenCalledWith('remaining');

    fireEvent.press(getByTestId('summary-card-loans'));
    expect(onPressCard).toHaveBeenCalledWith('loans');
  });
});
