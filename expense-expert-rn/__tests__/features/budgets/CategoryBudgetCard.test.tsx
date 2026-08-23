import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CategoryBudgetCard } from '../../../src/features/budgets/components/CategoryBudgetCard';
import { BudgetUsage } from '../../../src/features/budgets/types/budget.types';
import { useCategories } from '../../../src/features/categories/hooks/useCategories';

jest.mock('../../../src/features/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

describe('CategoryBudgetCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCategories as jest.Mock).mockReturnValue({
      getCategoryByValue: jest.fn((cat: string) => ({
        value: cat,
        label: cat === 'food' ? 'Food & Dining' : cat,
        icon: '🍔',
        isCustom: false,
      })),
    });
  });

  const mockUnderUsage: BudgetUsage = {
    budgetId: '2026-08_food',
    category: 'food',
    month: '2026-08',
    limitInCents: 50000,
    limit: 500,
    spentInCents: 20000,
    spent: 200,
    remainingInCents: 30000,
    remaining: 300,
    percentage: 40,
    thresholdState: 'under',
    isExceeded: false,
    isNearLimit: false,
  };

  const mockExceededUsage: BudgetUsage = {
    budgetId: '2026-08_food',
    category: 'food',
    month: '2026-08',
    limitInCents: 50000,
    limit: 500,
    spentInCents: 62000,
    spent: 620,
    remainingInCents: -12000,
    remaining: -120,
    percentage: 124,
    thresholdState: 'exceeded',
    isExceeded: true,
    isNearLimit: false,
  };

  it('renders category details, limit, spent, and remaining balances for on-track budget', () => {
    const { getByTestId, getByText } = render(
      <CategoryBudgetCard usage={mockUnderUsage} />
    );

    expect(getByTestId('category-budget-card')).toBeTruthy();
    expect(getByText('Food & Dining')).toBeTruthy();
    expect(getByText('On Track')).toBeTruthy();
    expect(getByTestId('category-budget-card-spent')).toHaveTextContent('$200.00');
    expect(getByTestId('category-budget-card-limit')).toHaveTextContent('$500.00');
    expect(getByTestId('category-budget-card-remaining')).toHaveTextContent('$300.00');
  });

  it('renders exceeded budget state with overspent badge and negative remaining balance', () => {
    const { getByTestId, getByText } = render(
      <CategoryBudgetCard usage={mockExceededUsage} />
    );

    expect(getByText('Exceeded by $120.00')).toBeTruthy();
    expect(getByTestId('category-budget-card-spent')).toHaveTextContent('$620.00');
    expect(getByTestId('category-budget-card-remaining')).toHaveTextContent('-$120.00');
  });

  it('triggers onEdit callback when Edit button is clicked', () => {
    const onEdit = jest.fn();
    const { getByTestId } = render(
      <CategoryBudgetCard usage={mockUnderUsage} onEdit={onEdit} />
    );

    fireEvent.press(getByTestId('category-budget-card-edit-btn'));
    expect(onEdit).toHaveBeenCalledWith(mockUnderUsage);
  });

  it('triggers onDelete callback when Remove button is clicked', () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <CategoryBudgetCard usage={mockUnderUsage} onDelete={onDelete} />
    );

    fireEvent.press(getByTestId('category-budget-card-delete-btn'));
    expect(onDelete).toHaveBeenCalledWith('2026-08_food');
  });
});
