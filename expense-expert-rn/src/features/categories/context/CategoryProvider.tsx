import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { CategoryService } from '../services/category.service';
import { CategoryItem } from '../types/category.types';
import { CategoryContext, CategoryContextType } from './CategoryContext';

export interface CategoryProviderProps {
  children: React.ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const builtInCategories = useMemo(() => CategoryService.getBuiltInCategories(), []);

  const categories = useMemo(() => {
    return [...builtInCategories, ...customCategories];
  }, [builtInCategories, customCategories]);

  const loadCategories = useCallback(async (userId: string) => {
    if (!userId) {
      setCustomCategories([]);
      return;
    }
    setIsLoading(true);
    try {
      const customs = await CategoryService.fetchCustomCategories(userId);
      setCustomCategories(customs);
    } catch (error) {
      console.warn('Failed to load categories in CategoryProvider:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadCategories(user.uid);
    } else {
      setCustomCategories([]);
      setIsLoading(false);
    }
  }, [user?.uid, loadCategories]);

  const refreshCategories = useCallback(async () => {
    if (user?.uid) {
      await loadCategories(user.uid);
    }
  }, [user?.uid, loadCategories]);

  const addCategory = useCallback(
    async (name: string, icon: string): Promise<CategoryItem> => {
      if (!user?.uid) {
        throw new Error('User must be logged in to create custom categories');
      }
      const newCategory = await CategoryService.addCustomCategory(user.uid, {
        name,
        icon,
      });

      setCustomCategories((prev) => {
        const next = [...prev.filter((c) => c.id !== newCategory.id), newCategory];
        return next.sort((a, b) => a.label.localeCompare(b.label));
      });

      return newCategory;
    },
    [user?.uid]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      if (!user?.uid) {
        throw new Error('User must be logged in to delete custom categories');
      }
      await CategoryService.deleteCustomCategory(user.uid, id);
      setCustomCategories((prev) => prev.filter((c) => c.id !== id && c.value !== id));
    },
    [user?.uid]
  );

  const getCategoryByValue = useCallback(
    (value: string): CategoryItem => {
      if (!value) {
        return {
          value: '',
          label: 'Other',
          icon: '📁',
          isCustom: false,
        };
      }

      const normalized = value.toLowerCase().trim();
      const found = categories.find(
        (c) =>
          c.value.toLowerCase() === normalized ||
          c.id?.toLowerCase() === normalized ||
          c.label.toLowerCase() === normalized
      );

      if (found) {
        return found;
      }

      return {
        value,
        label: value,
        icon: '📁',
        isCustom: false,
      };
    },
    [categories]
  );

  const contextValue = useMemo<CategoryContextType>(
    () => ({
      categories,
      builtInCategories,
      customCategories,
      isLoading,
      addCategory,
      deleteCategory,
      getCategoryByValue,
      refreshCategories,
    }),
    [
      categories,
      builtInCategories,
      customCategories,
      isLoading,
      addCategory,
      deleteCategory,
      getCategoryByValue,
      refreshCategories,
    ]
  );

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};
