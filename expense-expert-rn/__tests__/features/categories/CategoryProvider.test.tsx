import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { CategoryProvider } from '@/features/categories/context/CategoryProvider';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { CategoryService } from '@/features/categories/services/category.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/categories/services/category.service', () => ({
  CategoryService: {
    getBuiltInCategories: jest.fn(),
    fetchCustomCategories: jest.fn(),
    addCustomCategory: jest.fn(),
    deleteCustomCategory: jest.fn(),
  },
}));

describe('CategoryProvider & useCategories', () => {
  const mockUser = { uid: 'user_123', email: 'test@example.com' };
  const mockBuiltInCategories = [
    { value: 'food', label: 'Food', icon: '🍔', isCustom: false },
    { value: 'transport', label: 'Transport', icon: '🚌', isCustom: false },
    { value: 'entertainment', label: 'Entertainment', icon: '🎮', isCustom: false },
    { value: 'utilities', label: 'Utilities', icon: '💡', isCustom: false },
    { value: 'savings', label: 'Savings', icon: '💰', isCustom: false },
    { value: 'loan_repayment', label: 'Loan Repayment', icon: '💳', isCustom: false },
    { value: 'other', label: 'Other', icon: '📁', isCustom: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (CategoryService.getBuiltInCategories as jest.Mock).mockReturnValue(mockBuiltInCategories);
    (CategoryService.fetchCustomCategories as jest.Mock).mockResolvedValue([]);
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <CategoryProvider>{children}</CategoryProvider>
  );

  it('throws error if useCategories is called outside CategoryProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCategories())).toThrow(
      'useCategories must be used within a CategoryProvider'
    );
    consoleSpy.mockRestore();
  });

  it('initializes with built-in categories and loads custom categories for logged-in user', async () => {
    const customCats = [
      { id: 'custom_coffee', value: 'custom_coffee', label: 'Coffee', icon: '☕', isCustom: true },
    ];
    (CategoryService.fetchCustomCategories as jest.Mock).mockResolvedValueOnce(customCats);

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.builtInCategories).toHaveLength(7);
    expect(result.current.customCategories).toEqual(customCats);
    expect(result.current.categories).toHaveLength(8);
  });

  it('resets custom categories if user is logged out', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    const { result } = renderHook(() => useCategories(), { wrapper });

    expect(result.current.customCategories).toEqual([]);
    expect(result.current.categories).toHaveLength(7);
  });

  describe('getCategoryByValue', () => {
    it('returns matching built-in category by value, label, or case-insensitive', async () => {
      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getCategoryByValue('food')).toEqual({
        value: 'food',
        label: 'Food',
        icon: '🍔',
        isCustom: false,
      });

      expect(result.current.getCategoryByValue('Food')).toEqual({
        value: 'food',
        label: 'Food',
        icon: '🍔',
        isCustom: false,
      });
    });

    it('returns matching custom category', async () => {
      const customCats = [
        { id: 'custom_gym_123', value: 'custom_gym_123', label: 'Gym', icon: '🏋️', isCustom: true },
      ];
      (CategoryService.fetchCustomCategories as jest.Mock).mockResolvedValueOnce(customCats);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.customCategories).toHaveLength(1);
      });

      expect(result.current.getCategoryByValue('custom_gym_123')).toEqual(customCats[0]);
      expect(result.current.getCategoryByValue('Gym')).toEqual(customCats[0]);
    });

    it('returns fallback for unknown or deleted category', async () => {
      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const resolved = result.current.getCategoryByValue('unknown_category');
      expect(resolved).toEqual({
        value: 'unknown_category',
        label: 'unknown_category',
        icon: '📁',
        isCustom: false,
      });
    });

    it('returns default fallback for empty string', async () => {
      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const resolved = result.current.getCategoryByValue('');
      expect(resolved).toEqual({
        value: '',
        label: 'Other',
        icon: '📁',
        isCustom: false,
      });
    });
  });

  describe('addCategory', () => {
    it('calls CategoryService.addCustomCategory and adds item to state', async () => {
      const newCat = {
        id: 'custom_books_123',
        value: 'custom_books_123',
        label: 'Books',
        icon: '📚',
        isCustom: true,
      };
      (CategoryService.addCustomCategory as jest.Mock).mockResolvedValueOnce(newCat);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const created = await result.current.addCategory('Books', '📚');
        expect(created).toEqual(newCat);
      });

      expect(CategoryService.addCustomCategory).toHaveBeenCalledWith(mockUser.uid, {
        name: 'Books',
        icon: '📚',
      });
      expect(result.current.customCategories).toContainEqual(newCat);
    });

    it('throws error when adding category while unauthenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      const { result } = renderHook(() => useCategories(), { wrapper });

      await expect(result.current.addCategory('Books', '📚')).rejects.toThrow(
        'User must be logged in to create custom categories'
      );
    });
  });

  describe('deleteCategory', () => {
    it('calls CategoryService.deleteCustomCategory and removes item from state', async () => {
      const customCats = [
        { id: 'custom_1', value: 'custom_1', label: 'Cat 1', icon: '🐾', isCustom: true },
        { id: 'custom_2', value: 'custom_2', label: 'Cat 2', icon: '🎮', isCustom: true },
      ];
      (CategoryService.fetchCustomCategories as jest.Mock).mockResolvedValueOnce(customCats);
      (CategoryService.deleteCustomCategory as jest.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.customCategories).toHaveLength(2);
      });

      await act(async () => {
        await result.current.deleteCategory('custom_1');
      });

      expect(CategoryService.deleteCustomCategory).toHaveBeenCalledWith(mockUser.uid, 'custom_1');
      expect(result.current.customCategories).toHaveLength(1);
      expect(result.current.customCategories[0].id).toBe('custom_2');
    });

    it('throws error when deleting category while unauthenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      const { result } = renderHook(() => useCategories(), { wrapper });

      await expect(result.current.deleteCategory('custom_1')).rejects.toThrow(
        'User must be logged in to delete custom categories'
      );
    });
  });

  describe('refreshCategories', () => {
    it('triggers reload of custom categories', async () => {
      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshCategories();
      });

      expect(CategoryService.fetchCustomCategories).toHaveBeenCalledWith(mockUser.uid);
    });
  });
});
