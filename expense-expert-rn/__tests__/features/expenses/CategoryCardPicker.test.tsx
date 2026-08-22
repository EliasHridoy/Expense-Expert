import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryCardPicker } from '../../../src/features/expenses/components/CategoryCardPicker';
import { ExpenseCategory } from '../../../src/features/expenses/types/category.types';

describe('CategoryCardPicker', () => {
  it('renders all default expense categories', () => {
    const onSelect = jest.fn();
    const { getByText, getByTestId } = render(
      <CategoryCardPicker
        selectedValue={ExpenseCategory.Food}
        onSelect={onSelect}
      />
    );

    expect(getByText('Food')).toBeTruthy();
    expect(getByText('Transport')).toBeTruthy();
    expect(getByText('Entertainment')).toBeTruthy();
    expect(getByText('Utilities')).toBeTruthy();
    expect(getByText('Savings')).toBeTruthy();
    expect(getByText('Loan Repayment')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();

    const foodCard = getByTestId(`category-card-${ExpenseCategory.Food}`);
    expect(foodCard.props.accessibilityState.selected).toBe(true);

    const transportCard = getByTestId(`category-card-${ExpenseCategory.Transport}`);
    expect(transportCard.props.accessibilityState.selected).toBe(false);
  });

  it('calls onSelect when a category card is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <CategoryCardPicker
        selectedValue={ExpenseCategory.Food}
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByTestId(`category-card-${ExpenseCategory.Transport}`));
    expect(onSelect).toHaveBeenCalledWith(ExpenseCategory.Transport);
  });

  it('renders custom categories in addition to builtin categories', () => {
    const onSelect = jest.fn();
    const customCategories = [
      {
        id: 'cat-pets',
        value: 'pets',
        label: 'Pets',
        icon: '🐶',
        isCustom: true,
      },
    ];

    const { getByText, getByTestId } = render(
      <CategoryCardPicker
        selectedValue="pets"
        onSelect={onSelect}
        customCategories={customCategories}
      />
    );

    expect(getByText('Pets')).toBeTruthy();
    expect(getByText('🐶')).toBeTruthy();
    const petsCard = getByTestId('category-card-pets');
    expect(petsCard.props.accessibilityState.selected).toBe(true);
  });
});
