import { RealtimeSyncManager, RealtimeSyncManagerClass } from '@/features/sync/services/RealtimeSyncManager';

describe('RealtimeSyncManager', () => {
  let manager: RealtimeSyncManagerClass;

  beforeEach(() => {
    manager = new RealtimeSyncManagerClass();
    jest.clearAllMocks();
  });

  afterEach(() => {
    manager.teardownAll();
  });

  it('registers a single subscription and cleans up on unregister', () => {
    const mockUnsubscribe = jest.fn();
    const createSub = jest.fn(() => mockUnsubscribe);

    const unsub = manager.register('expenses_uid1_2026-08', createSub);

    expect(createSub).toHaveBeenCalledTimes(1);
    expect(manager.hasSubscription('expenses_uid1_2026-08')).toBe(true);
    expect(manager.getActiveCount()).toBe(1);

    const entry = manager.getSubscription('expenses_uid1_2026-08');
    expect(entry?.subscriberCount).toBe(1);

    // Call returned unsubscribe
    unsub();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(manager.hasSubscription('expenses_uid1_2026-08')).toBe(false);
    expect(manager.getActiveCount()).toBe(0);
  });

  it('pools duplicate subscriptions using reference counting', () => {
    const mockUnsubscribe = jest.fn();
    const createSub = jest.fn(() => mockUnsubscribe);

    const unsub1 = manager.register('categories_uid1', createSub);
    const unsub2 = manager.register('categories_uid1', createSub);

    // Should only call createSub once for identical query key
    expect(createSub).toHaveBeenCalledTimes(1);
    expect(manager.getActiveCount()).toBe(1);
    expect(manager.getSubscription('categories_uid1')?.subscriberCount).toBe(2);

    // First unregister should decrement count but NOT call Firestore unsubscribe
    unsub1();
    expect(mockUnsubscribe).not.toHaveBeenCalled();
    expect(manager.hasSubscription('categories_uid1')).toBe(true);
    expect(manager.getSubscription('categories_uid1')?.subscriberCount).toBe(1);

    // Second unregister reaches 0 and executes Firestore unsubscribe
    unsub2();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(manager.hasSubscription('categories_uid1')).toBe(false);
    expect(manager.getActiveCount()).toBe(0);
  });

  it('handles unregistering non-existent key gracefully without throwing', () => {
    expect(() => {
      manager.unregister('non_existent_key');
    }).not.toThrow();
  });

  it('teardownAll() unsubscribes all active listeners and clears registry', () => {
    const unsubA = jest.fn();
    const unsubB = jest.fn();
    const unsubC = jest.fn();

    manager.register('key_a', () => unsubA);
    manager.register('key_b', () => unsubB);
    manager.register('key_c', () => unsubC);
    // Add extra subscriber to key_a
    manager.register('key_a', () => unsubA);

    expect(manager.getActiveCount()).toBe(3);

    manager.teardownAll();

    expect(unsubA).toHaveBeenCalledTimes(1);
    expect(unsubB).toHaveBeenCalledTimes(1);
    expect(unsubC).toHaveBeenCalledTimes(1);
    expect(manager.getActiveCount()).toBe(0);
    expect(manager.hasSubscription('key_a')).toBe(false);
    expect(manager.hasSubscription('key_b')).toBe(false);
    expect(manager.hasSubscription('key_c')).toBe(false);
  });

  it('catches and logs errors thrown inside unsubscribe handlers during unregister and teardown', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const buggyUnsub = jest.fn(() => {
      throw new Error('Firestore teardown failure');
    });

    const unsub = manager.register('faulty_key', () => buggyUnsub);

    expect(() => {
      unsub();
    }).not.toThrow();

    expect(buggyUnsub).toHaveBeenCalled();
    expect(manager.hasSubscription('faulty_key')).toBe(false);

    // Test error handling in teardownAll as well
    const buggyUnsub2 = jest.fn(() => {
      throw new Error('Teardown crash');
    });
    manager.register('faulty_key_2', () => buggyUnsub2);

    expect(() => {
      manager.teardownAll();
    }).not.toThrow();
    expect(manager.getActiveCount()).toBe(0);

    warnSpy.mockRestore();
  });

  it('singleton export works correctly', () => {
    const mockUnsub = jest.fn();
    const unsub = RealtimeSyncManager.register('singleton_test', () => mockUnsub);
    expect(RealtimeSyncManager.hasSubscription('singleton_test')).toBe(true);
    unsub();
    expect(RealtimeSyncManager.hasSubscription('singleton_test')).toBe(false);
  });
});
