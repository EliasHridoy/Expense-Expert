import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../config/firebase';
import { toCents, fromCents } from '../../expenses/utils/currency.util';
import { CategoryBudget, SetBudgetDto } from '../types/budget.types';

export const BUDGETS_CACHE_KEY_PREFIX = '@expense_expert_budgets_cache';

/**
 * BudgetService
 *
 * Provides Firestore persistence for user budgets under `users/{userId}/budgets`
 * and offline caching using AsyncStorage.
 */
export const BudgetService = {
  /**
   * Returns Firestore collection path for user's budgets.
   */
  getBudgetsPath(userId: string): string {
    return `users/${userId}/budgets`;
  },

  /**
   * Generates deterministic composite document key e.g. "2026-08_food".
   */
  getBudgetDocId(month: string, category: string): string {
    return `${month}_${category}`;
  },

  /**
   * Returns AsyncStorage cache key for a given user and month.
   */
  getCacheKey(userId: string, month: string): string {
    return `${BUDGETS_CACHE_KEY_PREFIX}_${userId}_${month}`;
  },

  /**
   * Fetches category budgets for a specific month with offline fallback.
   */
  async getBudgetsByMonth(userId: string, month: string): Promise<CategoryBudget[]> {
    if (!userId || !month) return [];

    try {
      const q = query(
        collection(db, this.getBudgetsPath(userId)),
        where('month', '==', month)
      );
      const snapshot = await getDocs(q);

      const budgets: CategoryBudget[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const limitInCents = Number.isFinite(data.limitInCents)
          ? data.limitInCents
          : toCents(data.limit);
        const limit = fromCents(limitInCents);

        const createdAt =
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());

        const updatedAt =
          data.updatedAt && typeof data.updatedAt.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString());

        return {
          id: docSnap.id,
          userId: data.userId || userId,
          category: data.category,
          month: data.month || month,
          limit,
          limitInCents,
          createdAt,
          updatedAt,
        };
      });

      // Cache the result
      await AsyncStorage.setItem(
        this.getCacheKey(userId, month),
        JSON.stringify(budgets)
      );

      return budgets;
    } catch (error) {
      console.warn(`Failed to fetch remote budgets for month ${month}, falling back to cache:`, error);
      try {
        const cached = await AsyncStorage.getItem(this.getCacheKey(userId, month));
        return cached ? (JSON.parse(cached) as CategoryBudget[]) : [];
      } catch (cacheError) {
        console.warn('Failed to load cached budgets:', cacheError);
        return [];
      }
    }
  },

  /**
   * Subscribes to real-time budget updates for a specific month in Firestore.
   */
  subscribeToBudgets(
    userId: string,
    month: string,
    onData: (budgets: CategoryBudget[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!userId || !month) {
      onData([]);
      return () => {};
    }

    const q = query(
      collection(db, this.getBudgetsPath(userId)),
      where('month', '==', month)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const budgets: CategoryBudget[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const limitInCents = Number.isFinite(data.limitInCents)
            ? data.limitInCents
            : toCents(data.limit);
          const limit = fromCents(limitInCents);

          const createdAt =
            data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());

          const updatedAt =
            data.updatedAt && typeof data.updatedAt.toDate === 'function'
              ? data.updatedAt.toDate().toISOString()
              : (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString());

          return {
            id: docSnap.id,
            userId: data.userId || userId,
            category: data.category,
            month: data.month || month,
            limit,
            limitInCents,
            createdAt,
            updatedAt,
          };
        });

        onData(budgets);

        // Update local cache in background
        AsyncStorage.setItem(
          this.getCacheKey(userId, month),
          JSON.stringify(budgets)
        ).catch((cacheError) => {
          console.warn('Failed to update budgets cache from snapshot:', cacheError);
        });
      },
      (error) => {
        if (onError) {
          onError(error);
        } else {
          console.warn(`[BudgetService] Realtime listener error for month ${month}:`, error);
        }
      }
    );
  },

  /**
   * Sets or updates a monthly category budget using idempotent composite ID.
   */
  async setCategoryBudget(userId: string, dto: SetBudgetDto): Promise<CategoryBudget> {
    if (!userId) throw new Error('User ID is required');
    if (!dto.category) throw new Error('Category is required');
    if (!dto.month) throw new Error('Month is required');

    const limitInCents = toCents(dto.limit);
    const limit = fromCents(limitInCents);
    const docId = this.getBudgetDocId(dto.month, dto.category);
    const docRef = doc(db, this.getBudgetsPath(userId), docId);

    const nowIso = new Date().toISOString();
    const budgetData = {
      id: docId,
      userId,
      category: dto.category,
      month: dto.month,
      limit,
      limitInCents,
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, budgetData, { merge: true });

    const result: CategoryBudget = {
      id: docId,
      userId,
      category: dto.category,
      month: dto.month,
      limit,
      limitInCents,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Update local cache
    try {
      const cacheKey = this.getCacheKey(userId, dto.month);
      const cached = await AsyncStorage.getItem(cacheKey);
      let list: CategoryBudget[] = cached ? JSON.parse(cached) : [];
      const existingIdx = list.findIndex((b) => b.id === docId);
      if (existingIdx >= 0) {
        list[existingIdx] = result;
      } else {
        list.push(result);
      }
      await AsyncStorage.setItem(cacheKey, JSON.stringify(list));
    } catch (cacheError) {
      console.warn('Failed to update budgets cache after setting:', cacheError);
    }

    return result;
  },

  /**
   * Deletes a category budget from Firestore and local cache.
   */
  async deleteCategoryBudget(userId: string, budgetId: string, month?: string): Promise<void> {
    if (!userId || !budgetId) return;

    const docRef = doc(db, this.getBudgetsPath(userId), budgetId);
    await deleteDoc(docRef);

    // Extract month from budgetId if not explicitly passed ("YYYY-MM_category")
    const targetMonth = month || budgetId.split('_')[0];
    if (targetMonth) {
      try {
        const cacheKey = this.getCacheKey(userId, targetMonth);
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const list: CategoryBudget[] = JSON.parse(cached);
          const filtered = list.filter((b) => b.id !== budgetId);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(filtered));
        }
      } catch (cacheError) {
        console.warn('Failed to update budgets cache after deleting:', cacheError);
      }
    }
  },
};
