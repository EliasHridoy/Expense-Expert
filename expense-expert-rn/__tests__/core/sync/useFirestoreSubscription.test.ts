import { renderHook } from '@testing-library/react-native';
import { useFirestoreSubscription } from '@/core/sync/hooks/useFirestoreSubscription';
import { SubscriptionManager } from '@/core/sync';

describe('useFirestoreSubscription (core/sync)', () => {
  beforeEach(() => {
    SubscriptionManager.teardownAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    SubscriptionManager.teardownAll();
  });

  it('subscribes on mount and unsubscribes on unmount', () => {
    const mockUnsubscribe = jest.fn();
    const subscribeFn = jest.fn(() => mockUnsubscribe);

    const { unmount } = renderHook(() =>
      useFirestoreSubscription('core_sub_key', subscribeFn)
    );

    expect(subscribeFn).toHaveBeenCalledTimes(1);
    expect(SubscriptionManager.hasSubscription('core_sub_key')).toBe(true);

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(SubscriptionManager.hasSubscription('core_sub_key')).toBe(false);
  });
});
