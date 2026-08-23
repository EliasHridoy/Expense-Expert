import React from 'react';
import { render } from '@testing-library/react-native';
import { CategoryBadge } from '@/features/categories/components/CategoryBadge';
import { useCategories } from '@/features/categories/hooks/useCategories';

jest.mock('@/features/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

describe('CategoryBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCategories as jest.Mock).mockReturnValue({
      getCategoryByValue: jest.fn((val: string) => {
        if (val === 'food') {
          return { value: 'food', label: 'Food', icon: '🍔', isCustom: false };
        }
        if (val === 'custom_games') {
          return { value: 'custom_games', label: 'Board Games', icon: '🎲', isCustom: true };
        }
        return { value: val, label: val, icon: '📁', isCustom: false };
      }),
    });
  });

  it('renders built-in category with icon and label', () => {
    const { getByTestId, getByText } = render(<CategoryBadge category="food" />);

    expect(getByTestId('category-badge')).toBeTruthy();
    expect(getByTestId('category-badge-icon')).toHaveTextContent('🍔');
    expect(getByTestId('category-badge-label')).toHaveTextContent('Food');
    expect(getByText('Food')).toBeTruthy();
  });

  it('renders custom category with custom icon and label', () => {
    const { getByTestId } = render(<CategoryBadge category="custom_games" />);

    expect(getByTestId('category-badge-icon')).toHaveTextContent('🎲');
    expect(getByTestId('category-badge-label')).toHaveTextContent('Board Games');
  });

  it('gracefully renders unknown or deleted category with fallback icon', () => {
    const { getByTestId } = render(<CategoryBadge category="deleted_cat_id" />);

    expect(getByTestId('category-badge-icon')).toHaveTextContent('📁');
    expect(getByTestId('category-badge-label')).toHaveTextContent('deleted_cat_id');
  });

  it('hides icon when showIcon is false', () => {
    const { queryByTestId, getByTestId } = render(
      <CategoryBadge category="food" showIcon={false} />
    );

    expect(queryByTestId('category-badge-icon')).toBeNull();
    expect(getByTestId('category-badge-label')).toHaveTextContent('Food');
  });

  it('renders with different size options (sm, lg)', () => {
    const { getByTestId, rerender } = render(
      <CategoryBadge category="food" size="sm" />
    );
    expect(getByTestId('category-badge')).toBeTruthy();

    rerender(<CategoryBadge category="food" size="lg" />);
    expect(getByTestId('category-badge')).toBeTruthy();
  });
});
