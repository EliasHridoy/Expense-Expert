import { CategoryService, CATEGORIES_CACHE_KEY } from '@/features/categories/services/category.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection-ref'),
  doc: jest.fn((_db, path, id) => `mock-doc-ref:${path}/${id}`),
  setDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  getDocs: jest.fn(),
  query: jest.fn(() => 'mock-query'),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  onSnapshot: jest.fn(),
}));

jest.mock('@/config/firebase', () => ({
  db: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe('CategoryService', () => {
  const userId = 'user_test_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBuiltInCategories', () => {
    it('returns 7 default categories with correct labels and icons', () => {
      const categories = CategoryService.getBuiltInCategories();
      expect(categories).toHaveLength(7);
      expect(categories[0]).toEqual({
        value: 'food',
        label: 'Food',
        icon: '🍔',
        isCustom: false,
      });
      expect(categories.find((c) => c.value === 'transport')?.icon).toBe('🚌');
      expect(categories.find((c) => c.value === 'entertainment')?.icon).toBe('🎮');
      expect(categories.find((c) => c.value === 'utilities')?.icon).toBe('💡');
      expect(categories.find((c) => c.value === 'savings')?.icon).toBe('💰');
      expect(categories.find((c) => c.value === 'loan_repayment')?.icon).toBe('💳');
      expect(categories.find((c) => c.value === 'other')?.icon).toBe('📁');
    });
  });

  describe('fetchCustomCategories', () => {
    it('returns empty array if userId is not provided', async () => {
      const result = await CategoryService.fetchCustomCategories('');
      expect(result).toEqual([]);
      expect(getDocs).not.toHaveBeenCalled();
    });

    it('queries Firestore, caches items, and returns mapped custom categories', async () => {
      const mockDocs = [
        {
          id: 'custom_coffee_1',
          data: () => ({ name: 'Coffee', icon: '☕' }),
        },
        {
          id: 'custom_gym_2',
          data: () => ({ name: 'Gym', icon: '🏋️' }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockDocs,
      });

      const result = await CategoryService.fetchCustomCategories(userId);

      expect(collection).toHaveBeenCalledWith({}, `users/${userId}/categories`);
      expect(orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'custom_coffee_1',
        value: 'custom_coffee_1',
        label: 'Coffee',
        icon: '☕',
        isCustom: true,
      });
      expect(result[1]).toEqual({
        id: 'custom_gym_2',
        value: 'custom_gym_2',
        label: 'Gym',
        icon: '🏋️',
        isCustom: true,
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `${CATEGORIES_CACHE_KEY}_${userId}`,
        JSON.stringify(result)
      );
    });

    it('falls back to AsyncStorage cache when Firestore query fails', async () => {
      const cachedCategories = [
        {
          id: 'custom_cached_1',
          value: 'custom_cached_1',
          label: 'Cached Category',
          icon: '🎁',
          isCustom: true,
        },
      ];

      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedCategories)
      );

      const result = await CategoryService.fetchCustomCategories(userId);

      expect(result).toEqual(cachedCategories);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        `${CATEGORIES_CACHE_KEY}_${userId}`
      );
    });

    it('returns empty array when both Firestore and cache fail', async () => {
      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage failure'));

      const result = await CategoryService.fetchCustomCategories(userId);
      expect(result).toEqual([]);
    });
  });

  describe('subscribeToCustomCategories', () => {
    it('returns dummy unsubscribe if userId is empty', () => {
      const onData = jest.fn();
      const unsub = CategoryService.subscribeToCustomCategories('', onData);
      expect(typeof unsub).toBe('function');
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
      const unsub = CategoryService.subscribeToCustomCategories(userId, onData);

      expect(typeof unsub).toBe('function');
      expect(require('firebase/firestore').onSnapshot).toHaveBeenCalled();

      const mockSnapshot = {
        docs: [
          {
            id: 'custom_snack',
            data: () => ({ name: 'Snacks', icon: '🍿' }),
          },
        ],
      };

      capturedSnapshotCallback(mockSnapshot);

      expect(onData).toHaveBeenCalledWith([
        {
          id: 'custom_snack',
          value: 'custom_snack',
          label: 'Snacks',
          icon: '🍿',
          isCustom: true,
        },
      ]);

      unsub();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('addCustomCategory', () => {
    it('creates custom category with DTO, writes to Firestore, updates cache, and returns CategoryItem', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const result = await CategoryService.addCustomCategory(userId, {
        name: 'Tech Gadgets',
        icon: '💻',
      });

      expect(result.label).toBe('Tech Gadgets');
      expect(result.icon).toBe('💻');
      expect(result.isCustom).toBe(true);
      expect(result.id).toMatch(/^custom_tech-gadgets_\d+$/);
      expect(result.value).toBe(result.id);

      expect(setDoc).toHaveBeenCalledWith(
        expect.stringContaining(`mock-doc-ref:users/${userId}/categories/custom_tech-gadgets_`),
        expect.objectContaining({
          name: 'Tech Gadgets',
          icon: '💻',
          createdAt: 'SERVER_TIMESTAMP',
          updatedAt: 'SERVER_TIMESTAMP',
        })
      );

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `${CATEGORIES_CACHE_KEY}_${userId}`,
        expect.stringContaining('Tech Gadgets')
      );
    });

    it('creates custom category with name and icon arguments', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await CategoryService.addCustomCategory(userId, 'Books', '📚');

      expect(result.label).toBe('Books');
      expect(result.icon).toBe('📚');
      expect(result.isCustom).toBe(true);
      expect(result.id).toMatch(/^custom_books_\d+$/);
    });
  });

  describe('deleteCustomCategory', () => {
    it('deletes document from Firestore and updates AsyncStorage cache', async () => {
      const categoryId = 'custom_coffee_1';
      const existingCached = [
        { id: 'custom_coffee_1', value: 'custom_coffee_1', label: 'Coffee', icon: '☕', isCustom: true },
        { id: 'custom_gym_2', value: 'custom_gym_2', label: 'Gym', icon: '🏋️', isCustom: true },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingCached));

      await CategoryService.deleteCustomCategory(userId, categoryId);

      expect(doc).toHaveBeenCalledWith({}, `users/${userId}/categories`, categoryId);
      expect(deleteDoc).toHaveBeenCalled();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `${CATEGORIES_CACHE_KEY}_${userId}`,
        JSON.stringify([existingCached[1]])
      );
    });

    it('does nothing if userId or categoryId is empty', async () => {
      await CategoryService.deleteCustomCategory('', 'some-id');
      expect(deleteDoc).not.toHaveBeenCalled();

      await CategoryService.deleteCustomCategory(userId, '');
      expect(deleteDoc).not.toHaveBeenCalled();
    });
  });
});
