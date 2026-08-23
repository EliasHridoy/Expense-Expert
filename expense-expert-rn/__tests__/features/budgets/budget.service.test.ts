import { BudgetService, BUDGETS_CACHE_KEY_PREFIX } from '../../../src/features/budgets/services/budget.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection-ref'),
  doc: jest.fn((_db, path, id) => `mock-doc-ref:${path}/${id}`),
  setDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  getDocs: jest.fn(),
  query: jest.fn(() => 'mock-query'),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  onSnapshot: jest.fn(),
}));

jest.mock('../../../src/config/firebase', () => ({
  db: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe('BudgetService', () => {
  const userId = 'user_test_456';
  const month = '2026-08';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBudgetsPath and getBudgetDocId', () => {
    it('generates correct Firestore path and composite doc ID', () => {
      expect(BudgetService.getBudgetsPath(userId)).toBe(`users/${userId}/budgets`);
      expect(BudgetService.getBudgetDocId('2026-08', 'food')).toBe('2026-08_food');
    });

    it('generates correct cache key', () => {
      expect(BudgetService.getCacheKey(userId, month)).toBe(
        `${BUDGETS_CACHE_KEY_PREFIX}_${userId}_${month}`
      );
    });
  });

  describe('getBudgetsByMonth', () => {
    it('returns empty array when userId or month is missing', async () => {
      const res1 = await BudgetService.getBudgetsByMonth('', month);
      expect(res1).toEqual([]);

      const res2 = await BudgetService.getBudgetsByMonth(userId, '');
      expect(res2).toEqual([]);

      expect(getDocs).not.toHaveBeenCalled();
    });

    it('queries Firestore, parses integer cents, saves to cache, and returns budgets', async () => {
      const mockDocs = [
        {
          id: '2026-08_food',
          data: () => ({
            category: 'food',
            month: '2026-08',
            limitInCents: 45000,
            limit: 450,
            createdAt: '2026-08-01T00:00:00.000Z',
            updatedAt: '2026-08-01T00:00:00.000Z',
          }),
        },
        {
          id: '2026-08_transport',
          data: () => ({
            category: 'transport',
            month: '2026-08',
            limit: 150.5,
            createdAt: { toDate: () => new Date('2026-08-01T00:00:00.000Z') },
            updatedAt: { toDate: () => new Date('2026-08-01T00:00:00.000Z') },
          }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({ docs: mockDocs });

      const result = await BudgetService.getBudgetsByMonth(userId, month);

      expect(collection).toHaveBeenCalledWith({}, `users/${userId}/budgets`);
      expect(where).toHaveBeenCalledWith('month', '==', month);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '2026-08_food',
        userId,
        category: 'food',
        month: '2026-08',
        limit: 450,
        limitInCents: 45000,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      });
      expect(result[1]).toEqual({
        id: '2026-08_transport',
        userId,
        category: 'transport',
        month: '2026-08',
        limit: 150.5,
        limitInCents: 15050,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        BudgetService.getCacheKey(userId, month),
        JSON.stringify(result)
      );
    });

    it('falls back to cache when Firestore query fails', async () => {
      const cachedBudgets = [
        {
          id: '2026-08_food',
          userId,
          category: 'food',
          month: '2026-08',
          limit: 300,
          limitInCents: 30000,
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        },
      ];

      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedBudgets));

      const result = await BudgetService.getBudgetsByMonth(userId, month);

      expect(result).toEqual(cachedBudgets);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        BudgetService.getCacheKey(userId, month)
      );
    });

    it('returns empty array when both Firestore and cache fail', async () => {
      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage failure'));

      const result = await BudgetService.getBudgetsByMonth(userId, month);
      expect(result).toEqual([]);
    });
  });

  describe('subscribeToBudgets', () => {
    it('returns dummy unsubscribe if userId or month is empty', () => {
      const onData = jest.fn();
      const unsub1 = BudgetService.subscribeToBudgets('', month, onData);
      expect(typeof unsub1).toBe('function');
      expect(onData).toHaveBeenCalledWith([]);

      onData.mockClear();
      const unsub2 = BudgetService.subscribeToBudgets(userId, '', onData);
      expect(typeof unsub2).toBe('function');
      expect(onData).toHaveBeenCalledWith([]);
    });

    it('sets up onSnapshot listener and maps documents', () => {
      const mockUnsubscribe = jest.fn();
      let capturedSnapshotCallback: any;

      (require('firebase/firestore').onSnapshot as jest.Mock).mockImplementation(
        (_q, callback) => {
          capturedSnapshotCallback = callback;
          return mockUnsubscribe;
        }
      );

      const onData = jest.fn();
      const unsub = BudgetService.subscribeToBudgets(userId, '2026-08', onData);

      expect(typeof unsub).toBe('function');
      expect(require('firebase/firestore').onSnapshot).toHaveBeenCalled();

      const mockSnapshot = {
        docs: [
          {
            id: '2026-08_food',
            data: () => ({
              userId,
              category: 'food',
              month: '2026-08',
              limit: 400,
              limitInCents: 40000,
              createdAt: '2026-08-01T00:00:00.000Z',
              updatedAt: '2026-08-01T00:00:00.000Z',
            }),
          },
        ],
      };

      capturedSnapshotCallback(mockSnapshot);

      expect(onData).toHaveBeenCalledWith([
        {
          id: '2026-08_food',
          userId,
          category: 'food',
          month: '2026-08',
          limit: 400,
          limitInCents: 40000,
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        },
      ]);

      unsub();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('setCategoryBudget', () => {
    it('sets budget with composite document ID and converts limit to integer cents', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const result = await BudgetService.setCategoryBudget(userId, {
        category: 'entertainment',
        month: '2026-08',
        limit: 250,
      });

      expect(result.id).toBe('2026-08_entertainment');
      expect(result.category).toBe('entertainment');
      expect(result.month).toBe('2026-08');
      expect(result.limit).toBe(250);
      expect(result.limitInCents).toBe(25000);

      expect(doc).toHaveBeenCalledWith({}, `users/${userId}/budgets`, '2026-08_entertainment');
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref:users/user_test_456/budgets/2026-08_entertainment',
        {
          id: '2026-08_entertainment',
          userId,
          category: 'entertainment',
          month: '2026-08',
          limit: 250,
          limitInCents: 25000,
          updatedAt: 'SERVER_TIMESTAMP',
        },
        { merge: true }
      );

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        BudgetService.getCacheKey(userId, '2026-08'),
        expect.stringContaining('2026-08_entertainment')
      );
    });

    it('updates existing item in local cache if present', async () => {
      const existing = [
        {
          id: '2026-08_entertainment',
          userId,
          category: 'entertainment',
          month: '2026-08',
          limit: 200,
          limitInCents: 20000,
          createdAt: '2026-08-01',
          updatedAt: '2026-08-01',
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));

      const result = await BudgetService.setCategoryBudget(userId, {
        category: 'entertainment',
        month: '2026-08',
        limit: 300,
      });

      expect(result.limit).toBe(300);
      expect(result.limitInCents).toBe(30000);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('throws error if required fields are missing', async () => {
      await expect(
        BudgetService.setCategoryBudget('', { category: 'food', month: '2026-08', limit: 100 })
      ).rejects.toThrow('User ID is required');

      await expect(
        BudgetService.setCategoryBudget(userId, { category: '', month: '2026-08', limit: 100 })
      ).rejects.toThrow('Category is required');

      await expect(
        BudgetService.setCategoryBudget(userId, { category: 'food', month: '', limit: 100 })
      ).rejects.toThrow('Month is required');
    });
  });

  describe('deleteCategoryBudget', () => {
    it('deletes document from Firestore and updates cache', async () => {
      const existing = [
        {
          id: '2026-08_food',
          userId,
          category: 'food',
          month: '2026-08',
          limit: 400,
          limitInCents: 40000,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: '2026-08_transport',
          userId,
          category: 'transport',
          month: '2026-08',
          limit: 200,
          limitInCents: 20000,
          createdAt: '',
          updatedAt: '',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));

      await BudgetService.deleteCategoryBudget(userId, '2026-08_food', '2026-08');

      expect(doc).toHaveBeenCalledWith({}, `users/${userId}/budgets`, '2026-08_food');
      expect(deleteDoc).toHaveBeenCalled();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        BudgetService.getCacheKey(userId, '2026-08'),
        JSON.stringify([existing[1]])
      );
    });

    it('does nothing if userId or budgetId is empty', async () => {
      await BudgetService.deleteCategoryBudget('', 'some_id');
      expect(deleteDoc).not.toHaveBeenCalled();

      await BudgetService.deleteCategoryBudget(userId, '');
      expect(deleteDoc).not.toHaveBeenCalled();
    });
  });
});
