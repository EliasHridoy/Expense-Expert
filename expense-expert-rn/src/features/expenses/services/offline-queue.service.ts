import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueuedMutation } from '../types/expense.types';

export const QUEUE_STORAGE_KEY = '@expense_expert_offline_queue';

/**
 * OfflineQueueService
 * 
 * Provides durable FIFO queue management in AsyncStorage for pending expense mutations
 * (creates, updates, deletes) when the client is offline or encounters network failures.
 */
export const OfflineQueueService = {
  /**
   * Retrieves all pending mutations in FIFO order.
   * Returns an empty array if storage is empty or corrupted.
   */
  async getQueue(): Promise<QueuedMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Appends a new mutation to the end of the queue.
   */
  async enqueue(
    mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<QueuedMutation> {
    const newItem: QueuedMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const currentQueue = await this.getQueue();
    const updatedQueue = [...currentQueue, newItem];
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
    return newItem;
  },

  /**
   * Removes a successfully processed mutation from the queue by its ID.
   */
  async remove(id: string): Promise<void> {
    const currentQueue = await this.getQueue();
    const updatedQueue = currentQueue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
  },

  /**
   * Increments the retry count and records the last error for a failed mutation.
   */
  async markFailed(id: string, error: string): Promise<void> {
    const currentQueue = await this.getQueue();
    const updatedQueue = currentQueue.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          retryCount: item.retryCount + 1,
          lastError: error,
        };
      }
      return item;
    });
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
  },

  /**
   * Purges all queued mutations from storage.
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  },

  /**
   * Returns the count of pending mutations, optionally filtered by user ID.
   */
  async getPendingCount(userId?: string): Promise<number> {
    const currentQueue = await this.getQueue();
    if (!userId) {
      return currentQueue.length;
    }
    return currentQueue.filter((item) => item.userId === userId).length;
  },
};
