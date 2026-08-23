import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MonthlyTrendBarChart } from '../../../src/features/dashboard/components/MonthlyTrendBarChart';
import { MonthlyTrend } from '../../../src/features/dashboard/types/dashboard.types';

describe('MonthlyTrendBarChart', () => {
  const mockTrends: MonthlyTrend[] = [
    {
      month: '2026-03',
      totalExpensesInCents: 200000,
      totalExpenses: 2000,
      totalSavingsInCents: 150000,
      totalSavings: 1500,
    },
    {
      month: '2026-04',
      totalExpensesInCents: 250000,
      totalExpenses: 2500,
      totalSavingsInCents: 100000,
      totalSavings: 1000,
    },
    {
      month: '2026-05',
      totalExpensesInCents: 300000,
      totalExpenses: 3000,
      totalSavingsInCents: 200000,
      totalSavings: 2000,
    },
  ];

  it('renders empty state when trends is empty', () => {
    const { getByTestId, getByText } = render(<MonthlyTrendBarChart trends={[]} />);

    expect(getByTestId('empty-trend-chart')).toBeTruthy();
    expect(getByText('No historical trend data')).toBeTruthy();
  });

  it('renders empty state when all values are zero', () => {
    const zeroTrends: MonthlyTrend[] = [
      {
        month: '2026-05',
        totalExpensesInCents: 0,
        totalExpenses: 0,
        totalSavingsInCents: 0,
        totalSavings: 0,
      },
    ];

    const { getByTestId } = render(<MonthlyTrendBarChart trends={zeroTrends} />);
    expect(getByTestId('empty-trend-chart')).toBeTruthy();
  });

  it('renders dual bars and legend for each month', () => {
    const { getByTestId, getByText } = render(<MonthlyTrendBarChart trends={mockTrends} />);

    expect(getByTestId('monthly-trend-bar-chart')).toBeTruthy();
    expect(getByText('Expenses vs Savings')).toBeTruthy();
    expect(getByText('Expenses')).toBeTruthy();
    expect(getByText('Savings')).toBeTruthy();

    expect(getByTestId('bar-expense-2026-03')).toBeTruthy();
    expect(getByTestId('bar-savings-2026-03')).toBeTruthy();

    expect(getByTestId('bar-expense-2026-04')).toBeTruthy();
    expect(getByTestId('bar-savings-2026-04')).toBeTruthy();

    expect(getByTestId('bar-expense-2026-05')).toBeTruthy();
    expect(getByTestId('bar-savings-2026-05')).toBeTruthy();

    expect(getByTestId('label-month-2026-03')).toBeTruthy();
    expect(getByTestId('label-month-2026-04')).toBeTruthy();
    expect(getByTestId('label-month-2026-05')).toBeTruthy();
  });

  it('handles bar click to display interactive tooltip banner and toggles off on second tap', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <MonthlyTrendBarChart trends={mockTrends} />
    );

    expect(queryByTestId('trend-tooltip-badge')).toBeNull();

    // Tap on expense bar for 2026-04
    fireEvent.press(getByTestId('bar-expense-2026-04'));

    expect(getByTestId('trend-tooltip-badge')).toBeTruthy();
    expect(getByText('2026-04')).toBeTruthy();
    expect(getByText('Exp: $2,500.00')).toBeTruthy();
    expect(getByText('Sav: $1,000.00')).toBeTruthy();

    // Tap again on 2026-04 savings bar to dismiss
    fireEvent.press(getByTestId('bar-savings-2026-04'));
    expect(queryByTestId('trend-tooltip-badge')).toBeNull();
  });

  it('accepts data prop as alternative to trends prop', () => {
    const { getByTestId } = render(<MonthlyTrendBarChart data={mockTrends} />);
    expect(getByTestId('monthly-trend-bar-chart')).toBeTruthy();
    expect(getByTestId('bar-expense-2026-03')).toBeTruthy();
  });
});
