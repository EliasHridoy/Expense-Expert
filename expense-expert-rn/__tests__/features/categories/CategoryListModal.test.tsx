import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CategoryListModal } from '@/features/categories/components/CategoryListModal';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { CATEGORY_ICONS } from '@/features/categories/types/category.types';

jest.mock('@/features/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

describe('CategoryListModal', () => {
  const mockAddCategory = jest.fn();
  const mockDeleteCategory = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCategories as jest.Mock).mockReturnValue({
      customCategories: [],
      addCategory: mockAddCategory,
      deleteCategory: mockDeleteCategory,
      isLoading: false,
    });
  });

  it('renders modal with all components when visible', () => {
    const { getByTestId, getByText } = render(
      <CategoryListModal visible={true} onClose={mockOnClose} />
    );

    expect(getByTestId('category-list-modal')).toBeTruthy();
    expect(getByText('Manage Categories')).toBeTruthy();
    expect(getByText('Create New Category')).toBeTruthy();
    expect(getByTestId('category-name-input')).toBeTruthy();
    expect(getByTestId('category-icon-picker')).toBeTruthy();
    expect(getByTestId('save-category-btn')).toBeTruthy();
    expect(getByTestId('empty-custom-categories')).toBeTruthy();
  });

  it('renders all 30 emoji options in the icon picker', () => {
    const { getByTestId } = render(
      <CategoryListModal visible={true} onClose={mockOnClose} />
    );

    CATEGORY_ICONS.forEach((icon) => {
      expect(getByTestId(`emoji-option-${icon}`)).toBeTruthy();
    });
  });

  it('shows error if submitting empty category name', async () => {
    const { getByTestId, getByText } = render(
      <CategoryListModal visible={true} onClose={mockOnClose} />
    );

    fireEvent.press(getByTestId('save-category-btn'));

    await waitFor(() => {
      expect(getByTestId('category-form-error')).toBeTruthy();
      expect(getByText('Category name is required')).toBeTruthy();
    });

    expect(mockAddCategory).not.toHaveBeenCalled();
  });

  it('allows emoji selection and successfully creates category', async () => {
    mockAddCategory.mockResolvedValueOnce({
      id: 'custom_gaming_1',
      value: 'custom_gaming_1',
      label: 'Gaming',
      icon: '🎮',
      isCustom: true,
    });

    const { getByTestId, queryByTestId } = render(
      <CategoryListModal visible={true} onClose={mockOnClose} />
    );

    // Type category name
    fireEvent.changeText(getByTestId('category-name-input'), 'Gaming');

    // Select emoji
    fireEvent.press(getByTestId('emoji-option-🎮'));

    // Click submit
    fireEvent.press(getByTestId('save-category-btn'));

    await waitFor(() => {
      expect(mockAddCategory).toHaveBeenCalledWith('Gaming', '🎮');
    });

    expect(getByTestId('category-name-input').props.value).toBe('');
    expect(queryByTestId('category-form-error')).toBeNull();
  });

  it('handles addCategory rejection gracefully', async () => {
    mockAddCategory.mockRejectedValueOnce(new Error('Network failure'));

    const { getByTestId, getByText } = render(
      <CategoryListModal visible={true} onClose={mockOnClose} />
    );

    fireEvent.changeText(getByTestId('category-name-input'), 'Fitness');
    fireEvent.press(getByTestId('save-category-btn'));

    await waitFor(() => {
      expect(getByTestId('category-form-error')).toBeTruthy();
      expect(getByText('Network failure')).toBeTruthy();
    });
  });

  it('renders custom categories and triggers deletion', async () => {
    const customCats = [
      { id: 'custom_coffee', value: 'custom_coffee', label: 'Coffee', icon: '☕', isCustom: true },
      { id: 'custom_gym', value: 'custom_gym', label: 'Gym', icon: '🏋️', isCustom: true },
    ];

    (useCategories as jest.Mock).mockReturnValue({
      customCategories: customCats,
      addCategory: mockAddCategory,
      deleteCategory: mockDeleteCategory,
      isLoading: false,
    });

    const { getByTestId, getByText } = render(
      <CategoryListModal visible={true} onClose={mockOnClose} />
    );

    expect(getByText('Coffee')).toBeTruthy();
    expect(getByText('Gym')).toBeTruthy();

    const deleteBtn = getByTestId('delete-category-custom_coffee');
    fireEvent.press(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('custom_coffee');
    });
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(
      <CategoryListModal visible={true} onClose={mockOnClose} />
    );

    fireEvent.press(getByTestId('close-category-modal-btn'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
