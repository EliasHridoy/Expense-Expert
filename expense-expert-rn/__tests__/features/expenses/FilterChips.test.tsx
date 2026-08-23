import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterChips } from '../../../src/features/expenses/components/FilterChips';
import { CategoryContext, CategoryContextType } from '../../../src/features/categories/context/CategoryContext';

describe('FilterChips Component', () => {
  const mockOnSelectCategory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders default built-in category chips including "All"', () => {
    const { getByTestId, getByText } = render(
      <FilterChips
        selectedCategory="all"
        onSelectCategory={mockOnSelectCategory}
      />
    );

    expect(getByTestId('filter-chip-all')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByTestId('filter-chip-food')).toBeTruthy();
    expect(getByText('Food')).toBeTruthy();
    expect(getByTestId('filter-chip-transport')).toBeTruthy();
    expect(getByText('Transport')).toBeTruthy();
  });

  it('calls onSelectCategory when a category chip is pressed', () => {
    const { getByTestId } = render(
      <FilterChips
        selectedCategory="all"
        onSelectCategory={mockOnSelectCategory}
      />
    );

    fireEvent.press(getByTestId('filter-chip-food'));
    expect(mockOnSelectCategory).toHaveBeenCalledTimes(1);
    expect(mockOnSelectCategory).toHaveBeenCalledWith('food');

    fireEvent.press(getByTestId('filter-chip-transport'));
    expect(mockOnSelectCategory).toHaveBeenCalledWith('transport');
  });

  it('calls onSelectCategory with "all" when All chip is pressed', () => {
    const { getByTestId } = render(
      <FilterChips
        selectedCategory="food"
        onSelectCategory={mockOnSelectCategory}
      />
    );

    fireEvent.press(getByTestId('filter-chip-all'));
    expect(mockOnSelectCategory).toHaveBeenCalledWith('all');
  });

  it('renders custom categories when provided via CategoryContext', () => {
    const mockContextValue: CategoryContextType = {
      builtInCategories: [
        { value: 'food', label: 'Food', icon: '🍔', isCustom: false },
      ],
      categories: [
        { value: 'food', label: 'Food', icon: '🍔', isCustom: false },
        { value: 'custom_gym_1', label: 'Gym Membership', icon: '🏋️', isCustom: true, id: 'custom_gym_1' },
      ],
      customCategories: [
        { value: 'custom_gym_1', label: 'Gym Membership', icon: '🏋️', isCustom: true, id: 'custom_gym_1' },
      ],
      isLoading: false,
      addCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getCategoryByValue: jest.fn(),
      refreshCategories: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <CategoryContext.Provider value={mockContextValue}>
        <FilterChips
          selectedCategory="custom_gym_1"
          onSelectCategory={mockOnSelectCategory}
        />
      </CategoryContext.Provider>
    );

    expect(getByTestId('filter-chip-custom_gym_1')).toBeTruthy();
    expect(getByText('Gym Membership')).toBeTruthy();
    expect(getByText('🏋️')).toBeTruthy();

    fireEvent.press(getByTestId('filter-chip-custom_gym_1'));
    expect(mockOnSelectCategory).toHaveBeenCalledWith('custom_gym_1');
  });
});
