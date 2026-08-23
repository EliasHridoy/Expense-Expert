import { SubscriptionEntry, Unsubscribe } from '../types/sync.types';

export class RealtimeSyncManagerClass {
  private subscriptions: Map<string, SubscriptionEntry> = new Map();

  /**
   * Registers a Firestore subscription under a unique composite key.
   * If an active subscription already exists for this key, increments its reference count
   * and returns a teardown callback for this caller without duplicating the Firestore listener.
   */
  register(key: string, createSubscription: () => Unsubscribe): Unsubscribe {
    const existing = this.subscriptions.get(key);
    if (existing) {
      existing.subscriberCount += 1;
      return () => this.unregister(key);
    }

    const unsubscribe = createSubscription();
    this.subscriptions.set(key, {
      key,
      unsubscribe,
      subscriberCount: 1,
      createdAt: Date.now(),
    });

    return () => this.unregister(key);
  }

  /**
   * Decrements subscriber reference count for the specified key.
   * When subscriber count reaches 0, invokes the underlying Firestore unsubscribe callback
   * and purges the subscription entry from the active map.
   */
  unregister(key: string): void {
    const existing = this.subscriptions.get(key);
    if (!existing) return;

    existing.subscriberCount -= 1;
    if (existing.subscriberCount <= 0) {
      try {
        existing.unsubscribe();
      } catch (err) {
        console.warn(`[RealtimeSyncManager] Error during unsubscribe for key "${key}":`, err);
      }
      this.subscriptions.delete(key);
    }
  }

  /**
   * Immediately unsubscribes all active listeners across all domains and clears registry.
   * Typically called on user logout or when resetting application state.
   */
  teardownAll(): void {
    this.subscriptions.forEach((entry) => {
      try {
        entry.unsubscribe();
      } catch (err) {
        console.warn(`[RealtimeSyncManager] Error during teardown for key "${entry.key}":`, err);
      }
    });
    this.subscriptions.clear();
  }

  /**
   * Returns the count of active unique query subscriptions.
   */
  getActiveCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Checks whether an active subscription exists for the given key.
   */
  hasSubscription(key: string): boolean {
    return this.subscriptions.has(key);
  }

  /**
   * Retrieves subscription metadata for diagnostic/test introspection.
   */
  getSubscription(key: string): SubscriptionEntry | undefined {
    return this.subscriptions.get(key);
  }
}

export const RealtimeSyncManager = new RealtimeSyncManagerClass();
