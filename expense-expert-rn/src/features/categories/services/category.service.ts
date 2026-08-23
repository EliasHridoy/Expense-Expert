import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../config/firebase';
import {
  CategoryItem,
  CreateCategoryDto,
  CustomCategory,
  BUILTIN_CATEGORY_ICONS,
  EXPENSE_CATEGORIES,
} from '../types/category.types';

export const CATEGORIES_CACHE_KEY = '@expense_expert_categories_cache';

/**
 * CategoryService
 *
 * Provides Firestore operations for custom categories and local caching with AsyncStorage.
 */
export const CategoryService = {
  /**
   * Helper to construct user categories collection path.
   */
  getCategoriesPath(userId: string): string {
    return `users/${userId}/categories`;
  },

  /**
   * Get built-in categories formatted as CategoryItem array.
   */
  getBuiltInCategories(): CategoryItem[] {
    return EXPENSE_CATEGORIES.map((c) => ({
      value: c.value,
      label: c.label,
      icon: c.icon || BUILTIN_CATEGORY_ICONS[c.value] || '📁',
      isCustom: false,
    }));
  },

  /**
   * Fetch custom categories from Firestore with AsyncStorage offline fallback.
   */
  async fetchCustomCategories(userId: string): Promise<CategoryItem[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, this.getCategoriesPath(userId)),
        orderBy('name', 'asc')
      );
      const snapshot = await getDocs(q);
      const customs: CategoryItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          value: docSnap.id,
          label: data.name,
          icon: data.icon || '📁',
          isCustom: true,
        };
      });

      // Cache custom categories locally
      await AsyncStorage.setItem(
        `${CATEGORIES_CACHE_KEY}_${userId}`,
        JSON.stringify(customs)
      );

      return customs;
    } catch (error) {
      console.warn('Failed to fetch remote categories, loading cache:', error);
      try {
        const cached = await AsyncStorage.getItem(`${CATEGORIES_CACHE_KEY}_${userId}`);
        return cached ? (JSON.parse(cached) as CategoryItem[]) : [];
      } catch (cacheError) {
        console.warn('Failed to load cached categories:', cacheError);
        return [];
      }
    }
  },

  /**
   * Add a new custom category in Firestore and update local cache.
   */
  async addCustomCategory(
    userId: string,
    dtoOrName: CreateCategoryDto | string,
    maybeIcon?: string
  ): Promise<CategoryItem> {
    const name = typeof dtoOrName === 'string' ? dtoOrName : dtoOrName.name;
    const icon = typeof dtoOrName === 'string' ? (maybeIcon || '📁') : (dtoOrName.icon || '📁');

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/\s+/g, '-');
    const customId = `custom_${slug}_${Date.now()}`;
    const docRef = doc(db, this.getCategoriesPath(userId), customId);

    const docData = {
      id: customId,
      name: trimmedName,
      icon: icon || '📁',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, docData);

    const newItem: CategoryItem = {
      id: customId,
      value: customId,
      label: trimmedName,
      icon: icon || '📁',
      isCustom: true,
    };

    // Update local cache
    try {
      const cached = await AsyncStorage.getItem(`${CATEGORIES_CACHE_KEY}_${userId}`);
      const list: CategoryItem[] = cached ? JSON.parse(cached) : [];
      list.push(newItem);
      list.sort((a, b) => a.label.localeCompare(b.label));
      await AsyncStorage.setItem(
        `${CATEGORIES_CACHE_KEY}_${userId}`,
        JSON.stringify(list)
      );
    } catch (cacheError) {
      console.warn('Failed to update categories cache after adding:', cacheError);
    }

    return newItem;
  },

  /**
   * Delete a custom category from Firestore and remove from local cache.
   */
  async deleteCustomCategory(userId: string, categoryId: string): Promise<void> {
    if (!userId || !categoryId) return;

    const docRef = doc(db, this.getCategoriesPath(userId), categoryId);
    await deleteDoc(docRef);

    // Update local cache
    try {
      const cached = await AsyncStorage.getItem(`${CATEGORIES_CACHE_KEY}_${userId}`);
      if (cached) {
        const list: CategoryItem[] = JSON.parse(cached);
        const filtered = list.filter((item) => item.id !== categoryId && item.value !== categoryId);
        await AsyncStorage.setItem(
          `${CATEGORIES_CACHE_KEY}_${userId}`,
          JSON.stringify(filtered)
        );
      }
    } catch (cacheError) {
      console.warn('Failed to update categories cache after deleting:', cacheError);
    }
  },
};
