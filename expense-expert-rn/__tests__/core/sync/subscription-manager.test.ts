import { SubscriptionManager, SubscriptionManagerClass } from '@/core/sync';

describe('SubscriptionManager (core/sync)', () => {
  let manager: SubscriptionManagerClass;

  beforeEach(() => {
    manager = new SubscriptionManagerClass();
    jest.clearAllMocks();
  });

  afterEach(() => {
    manager.teardownAll();
  });

  it('registers and unregisters subscriptions correctly', () => {
    const mockUnsubscribe = jest.fn();
    const unsub = manager.register('core_test_key', () => mockUnsubscribe);

    expect(manager.hasSubscription('core_test_key')).toBe(true);
    expect(manager.getActiveCount()).toBe(1);

    unsub();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(manager.hasSubscription('core_test_key')).toBe(false);
  });

  it('handles reference counting correctly', () => {
    const mockUnsub = jest.fn();
    const unsub1 = manager.register('shared_key', () => mockUnsub);
    const unsub2 = manager.register('shared_key', () => mockUnsub);

    expect(manager.getActiveCount()).toBe(1);
    expect(manager.getSubscription('shared_key')?.subscriberCount).toBe(2);

    unsub1();
    expect(mockUnsub).not.toHaveBeenCalled();

    unsub2();
    expect(mockUnsub).toHaveBeenCalledTimes(1);
    expect(manager.getActiveCount()).toBe(0);
  });

  it('teardownAll clears all subscriptions', () => {
    const mockUnsub1 = jest.fn();
    const mockUnsub2 = jest.fn();
    manager.register('key1', () => mockUnsub1);
    manager.register('key2', () => mockUnsub2);

    manager.teardownAll();

    expect(mockUnsub1).toHaveBeenCalledTimes(1);
    expect(mockUnsub2).toHaveBeenCalledTimes(1);
    expect(manager.getActiveCount()).toBe(0);
  });
});
