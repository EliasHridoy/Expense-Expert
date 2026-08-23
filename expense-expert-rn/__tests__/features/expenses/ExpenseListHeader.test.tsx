import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExpenseSearchBar } from '../../../src/features/expenses/components/ExpenseSearchBar';
import { ExpenseListHeader } from '../../../src/features/expenses/components/ExpenseListHeader';
import { DEFAULT_FILTER_CRITERIA } from '../../../src/features/expenses/types/filter.types';

describe('ExpenseSearchBar Component', () => {
  const mockOnChangeText = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input with placeholder and search icon', () => {
    const { getByTestId, getByPlaceholderText } = render(
      <ExpenseSearchBar
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Search..."
      />
    );

    expect(getByTestId('expense-search-input')).toBeTruthy();
    expect(getByPlaceholderText('Search...')).toBeTruthy();
  });

  it('calls onChangeText when user types', () => {
    const { getByTestId } = render(
      <ExpenseSearchBar
        value=""
        onChangeText={mockOnChangeText}
      />
    );

    fireEvent.changeText(getByTestId('expense-search-input'), 'Netflix');
    expect(mockOnChangeText).toHaveBeenCalledWith('Netflix');
  });

  it('renders clear button when value is not empty and clears text on press', () => {
    const { getByTestId } = render(
      <ExpenseSearchBar
        value="Coffee"
        onChangeText={mockOnChangeText}
        onClear={mockOnClear}
      />
    );

    const clearButton = getByTestId('clear-search-button');
    expect(clearButton).toBeTruthy();

    fireEvent.press(clearButton);
    expect(mockOnChangeText).toHaveBeenCalledWith('');
    expect(mockOnClear).toHaveBeenCalled();
  });
});

describe('ExpenseListHeader Component', () => {
  const mockSelectCategory = jest.fn();
  const mockSelectPreset = jest.fn();
  const mockCustomDateChange = jest.fn();
  const mockSearchChange = jest.fn();
  const mockSelectSortBy = jest.fn();
  const mockSelectGroupBy = jest.fn();
  const mockToggleViewMode = jest.fn();
  const mockResetFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search bar, presets, filter chips, and summary badges', () => {
    const { getByTestId, getByText } = render(
      <ExpenseListHeader
        criteria={DEFAULT_FILTER_CRITERIA}
        viewMode="list"
        totalFilteredCents={15550}
        filteredCount={3}
        onSelectCategory={mockSelectCategory}
        onSelectPreset={mockSelectPreset}
        onCustomDateChange={mockCustomDateChange}
        onSearchChange={mockSearchChange}
        onSelectSortBy={mockSelectSortBy}
        onSelectGroupBy={mockSelectGroupBy}
        onToggleViewMode={mockToggleViewMode}
        onResetFilters={mockResetFilters}
      />
    );

    expect(getByTestId('expense-list-header')).toBeTruthy();
    expect(getByTestId('filtered-count-badge')).toBeTruthy();
    expect(getByText('3 items')).toBeTruthy();
    expect(getByTestId('filtered-total-badge')).toBeTruthy();
    expect(getByText('$155.50')).toBeTruthy();
  });

  it('handles sort modal selection', () => {
    const { getByTestId } = render(
      <ExpenseListHeader
        criteria={DEFAULT_FILTER_CRITERIA}
        viewMode="list"
        totalFilteredCents={0}
        filteredCount={0}
        onSelectCategory={mockSelectCategory}
        onSelectPreset={mockSelectPreset}
        onSearchChange={mockSearchChange}
        onSelectSortBy={mockSelectSortBy}
        onSelectGroupBy={mockSelectGroupBy}
        onToggleViewMode={mockToggleViewMode}
      />
    );

    fireEvent.press(getByTestId('sort-button'));
    expect(getByTestId('sort-modal')).toBeTruthy();

    fireEvent.press(getByTestId('sort-option-amount_desc'));
    expect(mockSelectSortBy).toHaveBeenCalledWith('amount_desc');
  });

  it('handles group modal selection', () => {
    const { getByTestId } = render(
      <ExpenseListHeader
        criteria={DEFAULT_FILTER_CRITERIA}
        viewMode="list"
        totalFilteredCents={0}
        filteredCount={0}
        onSelectCategory={mockSelectCategory}
        onSelectPreset={mockSelectPreset}
        onSearchChange={mockSearchChange}
        onSelectSortBy={mockSelectSortBy}
        onSelectGroupBy={mockSelectGroupBy}
        onToggleViewMode={mockToggleViewMode}
      />
    );

    fireEvent.press(getByTestId('group-button'));
    expect(getByTestId('group-modal')).toBeTruthy();

    fireEvent.press(getByTestId('group-option-category'));
    expect(mockSelectGroupBy).toHaveBeenCalledWith('category');
  });

  it('calls onToggleViewMode when view toggle button is clicked', () => {
    const { getByTestId } = render(
      <ExpenseListHeader
        criteria={DEFAULT_FILTER_CRITERIA}
        viewMode="list"
        totalFilteredCents={0}
        filteredCount={0}
        onSelectCategory={mockSelectCategory}
        onSelectPreset={mockSelectPreset}
        onSearchChange={mockSearchChange}
        onSelectSortBy={mockSelectSortBy}
        onSelectGroupBy={mockSelectGroupBy}
        onToggleViewMode={mockToggleViewMode}
      />
    );

    fireEvent.press(getByTestId('toggle-view-mode-button'));
    expect(mockToggleViewMode).toHaveBeenCalledTimes(1);
  });

  it('shows reset button when active filter is applied', () => {
    const { getByTestId } = render(
      <ExpenseListHeader
        criteria={{
          ...DEFAULT_FILTER_CRITERIA,
          category: 'food',
        }}
        viewMode="list"
        totalFilteredCents={2500}
        filteredCount={1}
        onSelectCategory={mockSelectCategory}
        onSelectPreset={mockSelectPreset}
        onSearchChange={mockSearchChange}
        onSelectSortBy={mockSelectSortBy}
        onSelectGroupBy={mockSelectGroupBy}
        onToggleViewMode={mockToggleViewMode}
        onResetFilters={mockResetFilters}
      />
    );

    const resetBtn = getByTestId('reset-filters-button');
    expect(resetBtn).toBeTruthy();

    fireEvent.press(resetBtn);
    expect(mockResetFilters).toHaveBeenCalledTimes(1);
  });
});
