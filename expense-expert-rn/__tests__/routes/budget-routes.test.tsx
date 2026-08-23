import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import BudgetsScreen from '../../app/(app)/budgets/index';
import { BudgetContext, BudgetContextType } from '../../src/features/budgets/context/BudgetContext';
import { CategoryContext } from '../../src/features/categories/context/CategoryContext';
import { BudgetUsage, BudgetSummary } from '../../src/features/budgets/types/budget.types';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

describe('Budgets Screen (app/(app)/budgets/index.tsx)', () => {
  const mockSummary: BudgetSummary = {
    totalLimitInCents: 100000,
    totalLimit: 1000,
    totalSpentInCents: 45000,
    totalSpent: 450,
    totalRemainingInCents: 55000,
    totalRemaining: 550,
    percentage: 45,
    thresholdState: 'under',
  };

  const mockUsages: BudgetUsage[] = [
    {
      budgetId: '2026-08_food',
      category: 'food',
      month: '2026-08',
      limitInCents: 50000,
      limit: 500,
      spentInCents: 25000,
      spent: 250,
      remainingInCents: 25000,
      remaining: 250,
      percentage: 50,
      thresholdState: 'under',
      isExceeded: false,
      isNearLimit: false,
    },
    {
      budgetId: '2026-08_entertainment',
      category: 'entertainment',
      month: '2026-08',
      limitInCents: 50000,
      limit: 500,
      spentInCents: 55000,
      spent: 550,
      remainingInCents: -5000,
      remaining: -50,
      percentage: 110,
      thresholdState: 'exceeded',
      isExceeded: true,
      isNearLimit: false,
    },
  ];

  const defaultCategoryContext = {
    categories: [
      { id: 'cat-1', value: 'food', label: 'Food', icon: '🍔', isCustom: false },
      { id: 'cat-2', value: 'entertainment', label: 'Entertainment', icon: '🎬', isCustom: false },
      { id: 'cat-3', value: 'books', label: 'Books', icon: '📚', isCustom: true },
    ],
    builtInCategories: [
      { id: 'cat-1', value: 'food', label: 'Food', icon: '🍔', isCustom: false },
      { id: 'cat-2', value: 'entertainment', label: 'Entertainment', icon: '🎬', isCustom: false },
    ],
    customCategories: [
      { id: 'cat-3', value: 'books', label: 'Books', icon: '📚', isCustom: true },
    ],
    isLoading: false,
    addCategory: jest.fn(),
    deleteCategory: jest.fn(),
    getCategoryByValue: (val: string) => ({
      id: val,
      value: val,
      label: val.charAt(0).toUpperCase() + val.slice(1),
      icon: val === 'food' ? '🍔' : val === 'entertainment' ? '🎬' : '📚',
      isCustom: val === 'books',
    }),
    refreshCategories: jest.fn(),
  };


  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders budgets screen header, summary card, and category cards', () => {
    const mockContext: BudgetContextType = {
      activeMonth: '2026-08',
      budgets: [],
      budgetUsages: mockUsages,
      summary: mockSummary,
      isLoading: false,
      setActiveMonth: jest.fn(),
      setBudget: jest.fn(),
      deleteBudget: jest.fn(),
      refreshBudgets: jest.fn(),
    };

    const { getByTestId, getByText, getAllByTestId } = render(
      <CategoryContext.Provider value={defaultCategoryContext}>
        <BudgetContext.Provider value={mockContext}>
          <BudgetsScreen />
        </BudgetContext.Provider>
      </CategoryContext.Provider>
    );

    expect(getByTestId('budgets-screen')).toBeTruthy();
    expect(getByText('Monthly Budgets')).toBeTruthy();
    expect(getByTestId('budget-summary-card')).toBeTruthy();
    expect(getByTestId('current-month-display')).toBeTruthy();
    expect(getAllByTestId('category-budget-card').length).toBe(2);
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('Entertainment')).toBeTruthy();
  });

  it('navigates back to dashboard when back button is pressed', () => {
    const mockContext: BudgetContextType = {
      activeMonth: '2026-08',
      budgets: [],
      budgetUsages: mockUsages,
      summary: mockSummary,
      isLoading: false,
      setActiveMonth: jest.fn(),
      setBudget: jest.fn(),
      deleteBudget: jest.fn(),
      refreshBudgets: jest.fn(),
    };

    const { getByTestId } = render(
      <CategoryContext.Provider value={defaultCategoryContext}>
        <BudgetContext.Provider value={mockContext}>
          <BudgetsScreen />
        </BudgetContext.Provider>
      </CategoryContext.Provider>
    );

    fireEvent.press(getByTestId('back-to-dashboard-btn'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('navigates previous and next months when arrows are pressed', () => {
    const setActiveMonth = jest.fn();
    const mockContext: BudgetContextType = {
      activeMonth: '2026-08',
      budgets: [],
      budgetUsages: mockUsages,
      summary: mockSummary,
      isLoading: false,
      setActiveMonth,
      setBudget: jest.fn(),
      deleteBudget: jest.fn(),
      refreshBudgets: jest.fn(),
    };

    const { getByTestId } = render(
      <CategoryContext.Provider value={defaultCategoryContext}>
        <BudgetContext.Provider value={mockContext}>
          <BudgetsScreen />
        </BudgetContext.Provider>
      </CategoryContext.Provider>
    );

    fireEvent.press(getByTestId('prev-month-btn'));
    expect(setActiveMonth).toHaveBeenCalledWith('2026-07');

    fireEvent.press(getByTestId('next-month-btn'));
    expect(setActiveMonth).toHaveBeenCalledWith('2026-09');
  });

  it('renders empty state when there are no category budgets set', () => {
    const emptySummary: BudgetSummary = {
      totalLimitInCents: 0,
      totalLimit: 0,
      totalSpentInCents: 0,
      totalSpent: 0,
      totalRemainingInCents: 0,
      totalRemaining: 0,
      percentage: 0,
      thresholdState: 'under',
    };

    const mockContext: BudgetContextType = {
      activeMonth: '2026-08',
      budgets: [],
      budgetUsages: [],
      summary: emptySummary,
      isLoading: false,
      setActiveMonth: jest.fn(),
      setBudget: jest.fn(),
      deleteBudget: jest.fn(),
      refreshBudgets: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <CategoryContext.Provider value={defaultCategoryContext}>
        <BudgetContext.Provider value={mockContext}>
          <BudgetsScreen />
        </BudgetContext.Provider>
      </CategoryContext.Provider>
    );

    expect(getByTestId('empty-budgets-view')).toBeTruthy();
    expect(getByText('No budgets set for this month')).toBeTruthy();
  });

  it('opens modal and submits new category budget', async () => {
    const setBudgetMock = jest.fn().mockResolvedValue(undefined);
    const mockContext: BudgetContextType = {
      activeMonth: '2026-08',
      budgets: [],
      budgetUsages: mockUsages,
      summary: mockSummary,
      isLoading: false,
      setActiveMonth: jest.fn(),
      setBudget: setBudgetMock,
      deleteBudget: jest.fn(),
      refreshBudgets: jest.fn(),
    };

    const { getByTestId } = render(
      <CategoryContext.Provider value={defaultCategoryContext}>
        <BudgetContext.Provider value={mockContext}>
          <BudgetsScreen />
        </BudgetContext.Provider>
      </CategoryContext.Provider>
    );

    // Open Modal
    fireEvent.press(getByTestId('open-set-budget-btn'));
    expect(getByTestId('set-budget-modal')).toBeTruthy();

    // Select category card
    fireEvent.press(getByTestId('category-card-books'));

    // Input amount
    fireEvent.changeText(getByTestId('budget-limit-input'), '150.00');

    // Save
    await act(async () => {
      fireEvent.press(getByTestId('save-budget-btn'));
    });


    expect(setBudgetMock).toHaveBeenCalledWith({
      category: 'books',
      month: '2026-08',
      limit: '150.00',
    });
  });

  it('handles deleting a category budget', async () => {
    const deleteBudgetMock = jest.fn().mockResolvedValue(undefined);
    const mockContext: BudgetContextType = {
      activeMonth: '2026-08',
      budgets: [],
      budgetUsages: mockUsages,
      summary: mockSummary,
      isLoading: false,
      setActiveMonth: jest.fn(),
      setBudget: jest.fn(),
      deleteBudget: deleteBudgetMock,
      refreshBudgets: jest.fn(),
    };

    const { getAllByTestId } = render(
      <CategoryContext.Provider value={defaultCategoryContext}>
        <BudgetContext.Provider value={mockContext}>
          <BudgetsScreen />
        </BudgetContext.Provider>
      </CategoryContext.Provider>
    );

    const deleteButtons = getAllByTestId('category-budget-card-delete-btn');
    fireEvent.press(deleteButtons[0]);

    expect(deleteBudgetMock).toHaveBeenCalledWith('2026-08_food');
  });
});
