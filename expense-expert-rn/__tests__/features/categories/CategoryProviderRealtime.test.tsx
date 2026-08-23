import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { CategoryProvider } from '@/features/categories/context/CategoryProvider';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { CategoryService } from '@/features/categories/services/category.service';
import { RealtimeSyncManager } from '@/features/sync/services/RealtimeSyncManager';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CategoryItem } from '@/features/categories/types/category.types';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/categories/services/category.service', () => ({
  CategoryService: {
    getBuiltInCategories: jest.fn(),
    fetchCustomCategories: jest.fn(),
    addCustomCategory: jest.fn(),
    deleteCustomCategory: jest.fn(),
    subscribeToCustomCategories: jest.fn(),
  },
}));

describe('CategoryProvider Realtime', () => {
  const mockUser = { uid: 'cat_user_realtime', email: 'cat_rt@example.com' };
  const mockBuiltInCategories: CategoryItem[] = [
    { value: 'food', label: 'Food', icon: '🍔', isCustom: false },
    { value: 'transport', label: 'Transport', icon: '🚌', isCustom: false },
  ];

  let capturedOnData: ((categories: CategoryItem[]) => void) | null = null;
  let capturedUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    RealtimeSyncManager.teardownAll();
    capturedUnsubscribe = jest.fn();
    capturedOnData = null;

    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (CategoryService.getBuiltInCategories as jest.Mock).mockReturnValue(mockBuiltInCategories);
    (CategoryService.fetchCustomCategories as jest.Mock).mockResolvedValue([]);

    (CategoryService.subscribeToCustomCategories as jest.Mock).mockImplementation(
      (_userId: string, onData: (categories: CategoryItem[]) => void) => {
        capturedOnData = onData;
        return capturedUnsubscribe;
      }
    );
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <CategoryProvider>{children}</CategoryProvider>
  );

  it('subscribes to custom categories via RealtimeSyncManager on mount', async () => {
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(CategoryService.subscribeToCustomCategories).toHaveBeenCalledWith(
        'cat_user_realtime',
        expect.any(Function),
        expect.any(Function)
      );
    });

    expect(capturedOnData).toBeDefined();

    const liveCustoms: CategoryItem[] = [
      { id: 'custom_gaming', value: 'custom_gaming', label: 'Gaming', icon: '🎮', isCustom: true },
      { id: 'custom_books', value: 'custom_books', label: 'Books', icon: '📚', isCustom: true },
    ];

    act(() => {
      capturedOnData!(liveCustoms);
    });

    expect(result.current.customCategories).toEqual(liveCustoms);
    expect(result.current.categories).toHaveLength(4); // 2 built-in + 2 custom
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(CategoryService.subscribeToCustomCategories).toHaveBeenCalled();
    });

    unmount();

    expect(capturedUnsubscribe).toHaveBeenCalled();
  });

  it('unsubscribes and clears custom categories on logout', async () => {
    const { rerender, result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(CategoryService.subscribeToCustomCategories).toHaveBeenCalled();
    });

    (useAuth as jest.Mock).mockReturnValue({ user: null });
    rerender({});

    expect(capturedUnsubscribe).toHaveBeenCalled();
    expect(result.current.customCategories).toEqual([]);
    expect(result.current.categories).toEqual(mockBuiltInCategories);
  });
});
