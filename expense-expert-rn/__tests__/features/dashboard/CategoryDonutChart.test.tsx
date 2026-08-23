import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryDonutChart } from '../../../src/features/dashboard/components/CategoryDonutChart';
import { CategoryBreakdown } from '../../../src/features/dashboard/types/dashboard.types';

describe('CategoryDonutChart', () => {
  const mockData: CategoryBreakdown[] = [
    {
      category: 'Groceries',
      totalInCents: 60000,
      total: 600,
      count: 5,
      percentage: 60,
    },
    {
      category: 'Utilities',
      totalInCents: 40000,
      total: 400,
      count: 2,
      percentage: 40,
    },
  ];

  it('renders empty state when data is empty', () => {
    const { getByTestId, getByText } = render(<CategoryDonutChart data={[]} />);

    expect(getByTestId('empty-donut-chart')).toBeTruthy();
    expect(getByText('No category spending recorded')).toBeTruthy();
    expect(getByText('Expenses logged for this month will appear here')).toBeTruthy();
  });

  it('renders empty state when all totals are zero', () => {
    const zeroData: CategoryBreakdown[] = [
      { category: 'Groceries', totalInCents: 0, total: 0, count: 0, percentage: 0 },
    ];
    const { getByTestId } = render(<CategoryDonutChart data={zeroData} />);
    expect(getByTestId('empty-donut-chart')).toBeTruthy();
  });

  it('renders donut slices and legend items for categories', () => {
    const { getByTestId, getByText } = render(<CategoryDonutChart data={mockData} />);

    expect(getByTestId('category-donut-chart')).toBeTruthy();
    expect(getByText('Spending by Category')).toBeTruthy();
    expect(getByText('7 transactions')).toBeTruthy();

    expect(getByTestId('donut-slice-Groceries')).toBeTruthy();
    expect(getByTestId('donut-slice-Utilities')).toBeTruthy();

    expect(getByTestId('legend-item-Groceries')).toBeTruthy();
    expect(getByTestId('legend-item-Utilities')).toBeTruthy();

    expect(getByText('TOTAL SPENT')).toBeTruthy();
    expect(getByText('$1,000.00')).toBeTruthy();
  });

  it('handles slice selection to update center readout and trigger callback', () => {
    const onSelectCategory = jest.fn();
    const { getByTestId, getByText, getAllByText, queryByText } = render(
      <CategoryDonutChart data={mockData} onSelectCategory={onSelectCategory} />
    );

    // Tap Groceries slice
    fireEvent.press(getByTestId('donut-slice-Groceries'));

    expect(onSelectCategory).toHaveBeenCalledWith('Groceries');
    expect(getByText('GROCERIES')).toBeTruthy();
    expect(getByText('$600.00')).toBeTruthy();
    expect(getAllByText('60%')).toHaveLength(2); // Center label and legend badge

    // Tap Groceries slice again to deselect
    fireEvent.press(getByTestId('donut-slice-Groceries'));

    expect(getByText('TOTAL SPENT')).toBeTruthy();
    expect(getByText('$1,000.00')).toBeTruthy();
    expect(queryByText('GROCERIES')).toBeNull();
  });

  it('handles legend row selection to highlight slice', () => {
    const onSelectCategory = jest.fn();
    const { getByTestId, getByText, getAllByText } = render(
      <CategoryDonutChart data={mockData} onSelectCategory={onSelectCategory} />
    );

    // Tap Utilities in legend
    fireEvent.press(getByTestId('legend-item-Utilities'));

    expect(onSelectCategory).toHaveBeenCalledWith('Utilities');
    expect(getByText('UTILITIES')).toBeTruthy();
    expect(getByText('$400.00')).toBeTruthy();
    expect(getAllByText('40%')).toHaveLength(2);
  });
});
