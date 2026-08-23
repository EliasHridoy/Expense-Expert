import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CategoriesScreen from '../../app/(app)/categories/index';
import { CategoryContext, CategoryContextType } from '../../src/features/categories/context/CategoryContext';

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

describe('Categories Screen (app/(app)/categories/index.tsx)', () => {
  const mockBuiltInCategories = [
    { id: 'cat-1', value: 'food', label: 'Food', icon: '🍔', isCustom: false },
    { id: 'cat-2', value: 'transport', label: 'Transport', icon: '🚗', isCustom: false },
    { id: 'cat-3', value: 'entertainment', label: 'Entertainment', icon: '🎬', isCustom: false },
  ];

  const mockCustomCategories = [
    { id: 'custom-1', value: 'gym', label: 'Gym', icon: '🏋️', isCustom: true },
    { id: 'custom-2', value: 'pets', label: 'Pets', icon: '🐶', isCustom: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders categories screen with standard and custom categories', () => {
    const mockContext: CategoryContextType = {
      categories: [...mockBuiltInCategories, ...mockCustomCategories],
      builtInCategories: mockBuiltInCategories,
      customCategories: mockCustomCategories,
      isLoading: false,
      addCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getCategoryByValue: jest.fn(),
      refreshCategories: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <CategoryContext.Provider value={mockContext}>
        <CategoriesScreen />
      </CategoryContext.Provider>
    );

    expect(getByTestId('categories-screen')).toBeTruthy();
    expect(getByText('Manage Categories')).toBeTruthy();
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('Transport')).toBeTruthy();
    expect(getByText('Gym')).toBeTruthy();
    expect(getByText('Pets')).toBeTruthy();
  });

  it('navigates back to dashboard when back button is pressed', () => {
    const mockContext: CategoryContextType = {
      categories: mockBuiltInCategories,
      builtInCategories: mockBuiltInCategories,
      customCategories: [],
      isLoading: false,
      addCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getCategoryByValue: jest.fn(),
      refreshCategories: jest.fn(),
    };

    const { getByTestId } = render(
      <CategoryContext.Provider value={mockContext}>
        <CategoriesScreen />
      </CategoryContext.Provider>
    );

    fireEvent.press(getByTestId('back-to-dashboard-btn'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('renders empty custom categories state when there are no custom categories', () => {
    const mockContext: CategoryContextType = {
      categories: mockBuiltInCategories,
      builtInCategories: mockBuiltInCategories,
      customCategories: [],
      isLoading: false,
      addCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getCategoryByValue: jest.fn(),
      refreshCategories: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <CategoryContext.Provider value={mockContext}>
        <CategoriesScreen />
      </CategoryContext.Provider>
    );

    expect(getByTestId('empty-custom-categories-view')).toBeTruthy();
    expect(getByText('No custom categories yet')).toBeTruthy();
  });

  it('opens category creation modal and submits a new custom category', async () => {
    const addCategoryMock = jest.fn().mockResolvedValue({
      id: 'custom-3',
      value: 'gaming',
      label: 'Gaming',
      icon: '🎮',
      isCustom: true,
    });

    const mockContext: CategoryContextType = {
      categories: [...mockBuiltInCategories, ...mockCustomCategories],
      builtInCategories: mockBuiltInCategories,
      customCategories: mockCustomCategories,
      isLoading: false,
      addCategory: addCategoryMock,
      deleteCategory: jest.fn(),
      getCategoryByValue: jest.fn(),
      refreshCategories: jest.fn(),
    };

    const { getByTestId, getByPlaceholderText } = render(
      <CategoryContext.Provider value={mockContext}>
        <CategoriesScreen />
      </CategoryContext.Provider>
    );

    // Open modal
    fireEvent.press(getByTestId('open-new-category-btn'));
    expect(getByTestId('category-list-modal')).toBeTruthy();

    // Type category name
    fireEvent.changeText(getByPlaceholderText('e.g. Subscriptions, Hobbies'), 'Gaming');

    // Submit
    await act(async () => {
      fireEvent.press(getByTestId('save-category-btn'));
    });

    expect(addCategoryMock).toHaveBeenCalledWith('Gaming', expect.any(String));
  });

  it('deletes a custom category when delete button is pressed', async () => {
    const deleteCategoryMock = jest.fn().mockResolvedValue(undefined);

    const mockContext: CategoryContextType = {
      categories: [...mockBuiltInCategories, ...mockCustomCategories],
      builtInCategories: mockBuiltInCategories,
      customCategories: mockCustomCategories,
      isLoading: false,
      addCategory: jest.fn(),
      deleteCategory: deleteCategoryMock,
      getCategoryByValue: jest.fn(),
      refreshCategories: jest.fn(),
    };

    const { getByTestId } = render(
      <CategoryContext.Provider value={mockContext}>
        <CategoriesScreen />
      </CategoryContext.Provider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('delete-category-custom-1'));
    });

    expect(deleteCategoryMock).toHaveBeenCalledWith('custom-1');
  });
});
