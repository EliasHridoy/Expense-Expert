/**
 * Dashboard Service
 *
 * Provides data access for dashboard financial metrics with Cloud Firestore range queries
 * and AsyncStorage offline caching for resilient mobile analytics.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../config/firebase';
import { toCents } from '../../expenses/utils/currency.util';
import {
  MonthSummary,
  MonthlyTrend,
  CategoryBreakdown,
  RawFinancialData,
} from '../types/dashboard.types';
import {
  computeMonthSummary,
  computeCategoryBreakdown,
  computeMonthlyTrend,
  getPastMonthKeys,
} from '../utils/aggregation.util';

export const DASHBOARD_SUMMARY_CACHE_PREFIX = '@expense_expert_dashboard_summary_';
export const DASHBOARD_TREND_CACHE_PREFIX = '@expense_expert_dashboard_trend_';
export const DASHBOARD_BREAKDOWN_CACHE_PREFIX = '@expense_expert_dashboard_breakdown_';

export const DashboardService = {
  /**
   * Helper paths for Firestore subcollections.
   */
  getExpensesPath(userId: string): string {
    return `users/${userId}/expenses`;
  },
  getSavingsPath(userId: string): string {
    return `users/${userId}/saving-entries`;
  },
  getIncomePath(userId: string): string {
    return `users/${userId}/income-entries`;
  },
  getLoansTakenPath(userId: string): string {
    return `users/${userId}/loans-taken`;
  },
  getUserProfilePath(userId: string): string {
    return `users/${userId}`;
  },

  /**
   * Fetches all multi-collection documents up to targetMonth in parallel.
   */
  async fetchRawFinancialData(
    userId: string,
    targetMonth: string
  ): Promise<RawFinancialData> {
    const expensesQuery = query(
      collection(db, this.getExpensesPath(userId)),
      where('month', '<=', targetMonth)
    );

    const savingsQuery = query(
      collection(db, this.getSavingsPath(userId)),
      where('month', '<=', targetMonth)
    );

    const incomeQuery = query(
      collection(db, this.getIncomePath(userId)),
      where('month', '<=', targetMonth)
    );

    const loansQuery = query(
      collection(db, this.getLoansTakenPath(userId)),
      where('month', '<=', targetMonth)
    );

    const profileDocRef = doc(db, 'users', userId);

    const [
      expensesSnap,
      savingsSnap,
      incomeSnap,
      loansSnap,
      profileSnap,
    ] = await Promise.all([
      getDocs(expensesQuery),
      getDocs(savingsQuery),
      getDocs(incomeQuery),
      getDocs(loansQuery),
      getDoc(profileDocRef),
    ]);

    const expenses = expensesSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      const amountInCents = data.amountInCents ?? toCents(data.amount);
      return {
        id: docSnap.id,
        amount: data.amount,
        amountInCents,
        category: data.category || 'General',
        month: data.month,
      };
    });

    const savingEntries = savingsSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      const amountInCents = data.amountInCents ?? toCents(data.amount);
      return {
        id: docSnap.id,
        amount: data.amount,
        amountInCents,
        type: data.type as 'deposit' | 'withdrawal',
        month: data.month,
      };
    });

    const incomeEntries = incomeSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      const amountInCents = data.amountInCents ?? toCents(data.amount);
      return {
        id: docSnap.id,
        amount: data.amount,
        amountInCents,
        month: data.month,
      };
    });

    const loansTaken = loansSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      const amountInCents = data.amountInCents ?? toCents(data.amount);
      return {
        id: docSnap.id,
        amount: data.amount,
        amountInCents,
        month: data.month,
      };
    });

    let profile = null;
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      let createdAtStr: string | undefined = undefined;
      if (data?.createdAt?.toDate) {
        createdAtStr = data.createdAt.toDate().toISOString();
      } else if (data?.createdAt) {
        createdAtStr = typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toISOString?.();
      }

      profile = {
        monthlySalary: data?.monthlySalary ?? 0,
        salaries: data?.salaries ?? {},
        createdAt: createdAtStr,
      };
    }

    return {
      month: targetMonth,
      profile,
      expenses,
      savingEntries,
      incomeEntries,
      loansTaken,
    };
  },

  /**
   * Fetches monthly summary with Firestore querying and AsyncStorage offline fallback.
   */
  async getMonthSummary(userId: string, month: string): Promise<MonthSummary> {
    const cacheKey = `${DASHBOARD_SUMMARY_CACHE_PREFIX}${userId}_${month}`;

    try {
      const rawData = await this.fetchRawFinancialData(userId, month);
      const summary = computeMonthSummary(rawData);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(summary));
      return summary;
    } catch (error) {
      // Offline fallback
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as MonthSummary;
        } catch (_parseError) {
          // If JSON parse fails, throw original error
        }
      }
      throw error;
    }
  },

  /**
   * Fetches historical trend series for the past `monthsCount` months.
   */
  async getMonthlyTrend(
    userId: string,
    monthsCount: number = 6,
    referenceMonth?: string
  ): Promise<MonthlyTrend[]> {
    const months = getPastMonthKeys(monthsCount, referenceMonth || new Date());
    const latestMonth = months[months.length - 1];
    const cacheKey = `${DASHBOARD_TREND_CACHE_PREFIX}${userId}_${latestMonth}_${monthsCount}`;

    try {
      const rawData = await this.fetchRawFinancialData(userId, latestMonth);
      const trend = computeMonthlyTrend(
        rawData.expenses,
        rawData.savingEntries,
        months
      );
      await AsyncStorage.setItem(cacheKey, JSON.stringify(trend));
      return trend;
    } catch (error) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as MonthlyTrend[];
        } catch (_parseError) {
          // If JSON parse fails, throw original error
        }
      }
      throw error;
    }
  },

  /**
   * Fetches category spending breakdown for the specified month.
   */
  async getCategoryBreakdown(
    userId: string,
    month: string
  ): Promise<CategoryBreakdown[]> {
    const cacheKey = `${DASHBOARD_BREAKDOWN_CACHE_PREFIX}${userId}_${month}`;

    try {
      const q = query(
        collection(db, this.getExpensesPath(userId)),
        where('month', '==', month)
      );
      const snapshot = await getDocs(q);
      const expenses = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const amountInCents = data.amountInCents ?? toCents(data.amount);
        return {
          id: docSnap.id,
          amount: data.amount,
          amountInCents,
          category: data.category || 'General',
          month: data.month || month,
        };
      });

      const breakdown = computeCategoryBreakdown(expenses, month);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(breakdown));
      return breakdown;
    } catch (error) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as CategoryBreakdown[];
        } catch (_parseError) {
          // If JSON parse fails, throw original error
        }
      }
      throw error;
    }
  },

  /**
   * Invalidates cached dashboard data for a user or all users.
   */
  async clearDashboardCache(userId?: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const targetPrefixes = [
        DASHBOARD_SUMMARY_CACHE_PREFIX,
        DASHBOARD_TREND_CACHE_PREFIX,
        DASHBOARD_BREAKDOWN_CACHE_PREFIX,
      ];

      const keysToRemove = allKeys.filter((key) => {
        const matchesPrefix = targetPrefixes.some((p) => key.startsWith(p));
        if (!matchesPrefix) return false;
        if (userId) {
          return key.includes(`${userId}_`);
        }
        return true;
      });

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (_error) {
      // Non-fatal cache eviction failure
    }
  },
};
