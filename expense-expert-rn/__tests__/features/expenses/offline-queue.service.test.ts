import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueueService, QUEUE_STORAGE_KEY } from '@/features/expenses/services/offline-queue.service';
import { QueuedMutation } from '@/features/expenses/types/expense.types';

describe('OfflineQueueService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('getQueue', () => {
    it('returns empty array when storage is empty', async () => {
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toEqual([]);
    });

    it('returns parsed array when storage contains items', async () => {
      const mockItems: QueuedMutation[] = [
        {
          id: 'mut_1',
          type: 'CREATE_EXPENSE',
          userId: 'user_123',
          expenseId: 'exp_1',
          payload: { title: 'Coffee', amount: 5 },
          timestamp: 1000,
          retryCount: 0,
        },
      ];
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(mockItems));

      const queue = await OfflineQueueService.getQueue();
      expect(queue).toEqual(mockItems);
    });

    it('returns empty array if storage content is corrupted or non-array', async () => {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, 'invalid json');
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toEqual([]);

      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify({ not: 'an array' }));
      const queue2 = await OfflineQueueService.getQueue();
      expect(queue2).toEqual([]);
    });
  });

  describe('enqueue', () => {
    it('appends mutation to queue and returns created mutation with id, timestamp, retryCount', async () => {
      const mutation = await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_123',
        expenseId: 'exp_123',
        payload: { title: 'Lunch', amount: 15 },
      });

      expect(mutation.id).toMatch(/^mut_\d+_[a-z0-9]+$/);
      expect(mutation.type).toBe('CREATE_EXPENSE');
      expect(mutation.userId).toBe('user_123');
      expect(mutation.expenseId).toBe('exp_123');
      expect(mutation.retryCount).toBe(0);
      expect(typeof mutation.timestamp).toBe('number');

      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toEqual(mutation);
    });

    it('maintains FIFO order when multiple mutations are enqueued', async () => {
      const mut1 = await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_123',
        expenseId: 'exp_1',
        payload: { title: 'First' },
      });

      const mut2 = await OfflineQueueService.enqueue({
        type: 'UPDATE_EXPENSE',
        userId: 'user_123',
        expenseId: 'exp_1',
        payload: { title: 'Updated' },
      });

      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].id).toBe(mut1.id);
      expect(queue[1].id).toBe(mut2.id);
    });
  });

  describe('remove', () => {
    it('removes item with matching ID and preserves remaining items', async () => {
      const mut1 = await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_123',
        expenseId: 'exp_1',
        payload: { title: 'Item 1' },
      });

      const mut2 = await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_123',
        expenseId: 'exp_2',
        payload: { title: 'Item 2' },
      });

      await OfflineQueueService.remove(mut1.id);

      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(mut2.id);
    });
  });

  describe('markFailed', () => {
    it('increments retryCount and updates lastError for target mutation', async () => {
      const mut = await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_123',
        expenseId: 'exp_1',
        payload: { title: 'Item 1' },
      });

      await OfflineQueueService.markFailed(mut.id, 'Network timeout');

      let queue = await OfflineQueueService.getQueue();
      expect(queue[0].retryCount).toBe(1);
      expect(queue[0].lastError).toBe('Network timeout');

      await OfflineQueueService.markFailed(mut.id, 'Service unavailable');

      queue = await OfflineQueueService.getQueue();
      expect(queue[0].retryCount).toBe(2);
      expect(queue[0].lastError).toBe('Service unavailable');
    });
  });

  describe('clearQueue', () => {
    it('removes the queue storage item completely', async () => {
      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_123',
        expenseId: 'exp_1',
        payload: { title: 'Item 1' },
      });

      await OfflineQueueService.clearQueue();

      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      expect(raw).toBeNull();
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toEqual([]);
    });
  });

  describe('getPendingCount', () => {
    it('returns total count when userId is not specified', async () => {
      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_1',
        expenseId: 'exp_1',
        payload: {},
      });
      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_2',
        expenseId: 'exp_2',
        payload: {},
      });

      const count = await OfflineQueueService.getPendingCount();
      expect(count).toBe(2);
    });

    it('returns filtered count when userId is specified', async () => {
      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_1',
        expenseId: 'exp_1',
        payload: {},
      });
      await OfflineQueueService.enqueue({
        type: 'CREATE_EXPENSE',
        userId: 'user_2',
        expenseId: 'exp_2',
        payload: {},
      });
      await OfflineQueueService.enqueue({
        type: 'UPDATE_EXPENSE',
        userId: 'user_1',
        expenseId: 'exp_1',
        payload: {},
      });

      expect(await OfflineQueueService.getPendingCount('user_1')).toBe(2);
      expect(await OfflineQueueService.getPendingCount('user_2')).toBe(1);
      expect(await OfflineQueueService.getPendingCount('user_3')).toBe(0);
    });
  });
});
