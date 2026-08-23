import {
  DashboardService,
  DASHBOARD_SUMMARY_CACHE_PREFIX,
  DASHBOARD_TREND_CACHE_PREFIX,
  DASHBOARD_BREAKDOWN_CACHE_PREFIX,
} from '../../../src/features/dashboard/services/dashboard.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, path) => `mock-collection:${path}`),
  doc: jest.fn((_db, path, id) => `mock-doc:${path}/${id}`),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((...args) => ({ type: 'query', args })),
  where: jest.fn((field, op, val) => ({ field, op, val })),
}));

jest.mock('../../../src/config/firebase', () => ({
  db: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

describe('DashboardService', () => {
  const userId = 'user_abc_123';
  const activeMonth = '2026-08';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRawFinancialData', () => {
    it('executes parallel queries across all 4 subcollections and profile document', async () => {
      // Mock expenses
      const mockExpenses = {
        docs: [
          {
            id: 'exp_1',
            data: () => ({
              amount: 50,
              amountInCents: 5000,
              category: 'Food',
              month: '2026-08',
            }),
          },
        ],
      };

      // Mock savings
      const mockSavings = {
        docs: [
          {
            id: 'sav_1',
            data: () => ({
              amount: 100,
              amountInCents: 10000,
              type: 'deposit',
              month: '2026-08',
            }),
          },
        ],
      };

      // Mock income
      const mockIncome = {
        docs: [
          {
            id: 'inc_1',
            data: () => ({
              amount: 250,
              amountInCents: 25000,
              month: '2026-08',
            }),
          },
        ],
      };

      // Mock loans
      const mockLoans = {
        docs: [
          {
            id: 'loan_1',
            data: () => ({
              amount: 500,
              amountInCents: 50000,
              month: '2026-08',
            }),
          },
        ],
      };

      // Mock profile
      const mockProfileSnap = {
        exists: () => true,
        data: () => ({
          monthlySalary: 3000,
          salaries: { '2026-01': 2800, '2026-06': 3000 },
          createdAt: { toDate: () => new Date('2026-01-01T00:00:00.000Z') },
        }),
      };

      (getDocs as jest.Mock)
        .mockResolvedValueOnce(mockExpenses)
        .mockResolvedValueOnce(mockSavings)
        .mockResolvedValueOnce(mockIncome)
        .mockResolvedValueOnce(mockLoans);

      (getDoc as jest.Mock).mockResolvedValueOnce(mockProfileSnap);

      const raw = await DashboardService.fetchRawFinancialData(userId, activeMonth);

      expect(where).toHaveBeenCalledWith('month', '<=', activeMonth);
      expect(raw.month).toBe(activeMonth);
      expect(raw.expenses).toHaveLength(1);
      expect(raw.savingEntries).toHaveLength(1);
      expect(raw.incomeEntries).toHaveLength(1);
      expect(raw.loansTaken).toHaveLength(1);
      expect(raw.profile?.monthlySalary).toBe(3000);
      expect(raw.profile?.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });

    it('handles non-existent user profile safely', async () => {
      (getDocs as jest.Mock)
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
        data: () => undefined,
      });

      const raw = await DashboardService.fetchRawFinancialData(userId, activeMonth);

      expect(raw.profile).toBeNull();
      expect(raw.expenses).toEqual([]);
    });
  });

  describe('getMonthSummary', () => {
    it('fetches data, computes summary, writes to AsyncStorage cache and returns summary', async () => {
      const mockExpenses = {
        docs: [
          {
            id: 'exp_1',
            data: () => ({
              amount: 100,
              amountInCents: 10000,
              category: 'Food',
              month: '2026-08',
            }),
          },
        ],
      };
      const mockSavings = {
        docs: [
          {
            id: 'sav_1',
            data: () => ({
              amount: 200,
              amountInCents: 20000,
              type: 'deposit',
              month: '2026-08',
            }),
          },
        ],
      };
      const mockIncome = { docs: [] };
      const mockLoans = { docs: [] };
      const mockProfileSnap = {
        exists: () => true,
        data: () => ({
          monthlySalary: 2000,
          createdAt: '2026-08-01T00:00:00.000Z',
        }),
      };

      (getDocs as jest.Mock)
        .mockResolvedValueOnce(mockExpenses)
        .mockResolvedValueOnce(mockSavings)
        .mockResolvedValueOnce(mockIncome)
        .mockResolvedValueOnce(mockLoans);
      (getDoc as jest.Mock).mockResolvedValueOnce(mockProfileSnap);

      const summary = await DashboardService.getMonthSummary(userId, activeMonth);

      expect(summary.month).toBe(activeMonth);
      expect(summary.totalIncomeInCents).toBe(200000);
      expect(summary.totalExpensesInCents).toBe(10000);
      expect(summary.totalSavingsInCents).toBe(20000);
      expect(summary.remainingInCents).toBe(170000);

      const expectedCacheKey = `${DASHBOARD_SUMMARY_CACHE_PREFIX}${userId}_${activeMonth}`;
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expectedCacheKey,
        JSON.stringify(summary)
      );
    });

    it('falls back to AsyncStorage cache when Firestore fetch fails', async () => {
      const cachedSummary = {
        month: activeMonth,
        totalIncomeInCents: 250000,
        totalIncome: 2500,
        currentMonthIncomeInCents: 250000,
        currentMonthIncome: 2500,
        previousMonthRemainingInCents: 0,
        previousMonthRemaining: 0,
        totalExpensesInCents: 80000,
        totalExpenses: 800,
        totalSavingsInCents: 20000,
        totalSavings: 200,
        remainingInCents: 150000,
        remaining: 1500,
        loansTakenIncomeInCents: 0,
        loansTakenIncome: 0,
        expenseCount: 3,
      };

      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));
      const expectedCacheKey = `${DASHBOARD_SUMMARY_CACHE_PREFIX}${userId}_${activeMonth}`;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedSummary)
      );

      const summary = await DashboardService.getMonthSummary(userId, activeMonth);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(expectedCacheKey);
      expect(summary).toEqual(cachedSummary);
    });

    it('rethrows error when Firestore fails and no cached data is available', async () => {
      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Firestore unavailable'));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        DashboardService.getMonthSummary(userId, activeMonth)
      ).rejects.toThrow('Firestore unavailable');
    });
  });

  describe('getMonthlyTrend', () => {
    it('queries historical data and computes trend series for past months', async () => {
      const mockExpenses = {
        docs: [
          {
            id: 'exp_1',
            data: () => ({
              amount: 500,
              amountInCents: 50000,
              category: 'General',
              month: '2026-08',
            }),
          },
          {
            id: 'exp_2',
            data: () => ({
              amount: 400,
              amountInCents: 40000,
              category: 'General',
              month: '2026-07',
            }),
          },
        ],
      };
      const mockSavings = {
        docs: [
          {
            id: 'sav_1',
            data: () => ({
              amount: 150,
              amountInCents: 15000,
              type: 'deposit',
              month: '2026-08',
            }),
          },
        ],
      };

      (getDocs as jest.Mock)
        .mockResolvedValueOnce(mockExpenses)
        .mockResolvedValueOnce(mockSavings)
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

      const trend = await DashboardService.getMonthlyTrend(userId, 3, '2026-08');

      expect(trend).toHaveLength(3);
      expect(trend[0].month).toBe('2026-06');
      expect(trend[1].month).toBe('2026-07');
      expect(trend[1].totalExpensesInCents).toBe(40000);
      expect(trend[2].month).toBe('2026-08');
      expect(trend[2].totalExpensesInCents).toBe(50000);
      expect(trend[2].totalSavingsInCents).toBe(15000);

      const expectedCacheKey = `${DASHBOARD_TREND_CACHE_PREFIX}${userId}_2026-08_3`;
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expectedCacheKey,
        JSON.stringify(trend)
      );
    });

    it('falls back to AsyncStorage cache on Firestore error', async () => {
      const cachedTrend = [
        {
          month: '2026-07',
          totalExpensesInCents: 30000,
          totalExpenses: 300,
          totalSavingsInCents: 10000,
          totalSavings: 100,
        },
        {
          month: '2026-08',
          totalExpensesInCents: 45000,
          totalExpenses: 450,
          totalSavingsInCents: 15000,
          totalSavings: 150,
        },
      ];

      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Connection lost'));
      const expectedCacheKey = `${DASHBOARD_TREND_CACHE_PREFIX}${userId}_2026-08_2`;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedTrend)
      );

      const trend = await DashboardService.getMonthlyTrend(userId, 2, '2026-08');

      expect(trend).toEqual(cachedTrend);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('queries month expenses, computes breakdown and persists to cache', async () => {
      const mockDocs = [
        {
          id: 'exp_1',
          data: () => ({
            amount: 150,
            amountInCents: 15000,
            category: 'Food',
            month: '2026-08',
          }),
        },
        {
          id: 'exp_2',
          data: () => ({
            amount: 50,
            amountInCents: 5000,
            category: 'Transport',
            month: '2026-08',
          }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({ docs: mockDocs });

      const breakdown = await DashboardService.getCategoryBreakdown(userId, activeMonth);

      expect(breakdown).toHaveLength(2);
      expect(breakdown[0]).toEqual({
        category: 'Food',
        totalInCents: 15000,
        total: 150,
        count: 1,
        percentage: 75,
      });
      expect(breakdown[1]).toEqual({
        category: 'Transport',
        totalInCents: 5000,
        total: 50,
        count: 1,
        percentage: 25,
      });

      const expectedCacheKey = `${DASHBOARD_BREAKDOWN_CACHE_PREFIX}${userId}_${activeMonth}`;
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expectedCacheKey,
        JSON.stringify(breakdown)
      );
    });

    it('falls back to cache when Firestore query fails', async () => {
      const cachedBreakdown = [
        {
          category: 'Food',
          totalInCents: 10000,
          total: 100,
          count: 1,
          percentage: 100,
        },
      ];

      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const expectedCacheKey = `${DASHBOARD_BREAKDOWN_CACHE_PREFIX}${userId}_${activeMonth}`;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedBreakdown)
      );

      const breakdown = await DashboardService.getCategoryBreakdown(userId, activeMonth);

      expect(breakdown).toEqual(cachedBreakdown);
    });
  });

  describe('clearDashboardCache', () => {
    it('removes matching cache keys for a given user', async () => {
      const mockKeys = [
        `${DASHBOARD_SUMMARY_CACHE_PREFIX}${userId}_2026-08`,
        `${DASHBOARD_TREND_CACHE_PREFIX}${userId}_2026-08_6`,
        `${DASHBOARD_BREAKDOWN_CACHE_PREFIX}${userId}_2026-08`,
        `${DASHBOARD_SUMMARY_CACHE_PREFIX}other_user_2026-08`,
        '@some_other_cache_key',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce(mockKeys);

      await DashboardService.clearDashboardCache(userId);

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        `${DASHBOARD_SUMMARY_CACHE_PREFIX}${userId}_2026-08`,
        `${DASHBOARD_TREND_CACHE_PREFIX}${userId}_2026-08_6`,
        `${DASHBOARD_BREAKDOWN_CACHE_PREFIX}${userId}_2026-08`,
      ]);
    });
  });
});
