import { renderHook } from '@testing-library/react-native';
import { useFirestoreSubscription } from '@/features/sync/hooks/useFirestoreSubscription';
import { RealtimeSyncManager } from '@/features/sync/services/RealtimeSyncManager';

describe('useFirestoreSubscription', () => {
  beforeEach(() => {
    RealtimeSyncManager.teardownAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  it('registers subscription on mount and unregisters on unmount', () => {
    const mockUnsubscribe = jest.fn();
    const subscribeFn = jest.fn(() => mockUnsubscribe);

    const { unmount } = renderHook(() =>
      useFirestoreSubscription('expenses_uid_2026-08', subscribeFn)
    );

    expect(subscribeFn).toHaveBeenCalledTimes(1);
    expect(RealtimeSyncManager.hasSubscription('expenses_uid_2026-08')).toBe(true);

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(RealtimeSyncManager.hasSubscription('expenses_uid_2026-08')).toBe(false);
  });

  it('does not register subscription when key is null, undefined, or empty', () => {
    const mockUnsubscribe = jest.fn();
    const subscribeFn = jest.fn(() => mockUnsubscribe);

    const { rerender } = renderHook<void, { key: string | null | undefined }>(
      ({ key }) => useFirestoreSubscription(key, subscribeFn),
      { initialProps: { key: null } }
    );

    expect(subscribeFn).not.toHaveBeenCalled();
    expect(RealtimeSyncManager.getActiveCount()).toBe(0);

    rerender({ key: undefined });
    expect(subscribeFn).not.toHaveBeenCalled();

    rerender({ key: '' });
    expect(subscribeFn).not.toHaveBeenCalled();
  });

  it('does not register subscription when enabled is false', () => {
    const mockUnsubscribe = jest.fn();
    const subscribeFn = jest.fn(() => mockUnsubscribe);

    const { rerender } = renderHook<void, { enabled: boolean }>(
      ({ enabled }) =>
        useFirestoreSubscription('budgets_uid', subscribeFn, [], { enabled }),
      { initialProps: { enabled: false } }
    );

    expect(subscribeFn).not.toHaveBeenCalled();
    expect(RealtimeSyncManager.hasSubscription('budgets_uid')).toBe(false);

    // When toggled to enabled, it registers
    rerender({ enabled: true });
    expect(subscribeFn).toHaveBeenCalledTimes(1);
    expect(RealtimeSyncManager.hasSubscription('budgets_uid')).toBe(true);
  });

  it('unregisters old key and registers new key when key changes', () => {
    const mockUnsubscribe1 = jest.fn();
    const mockUnsubscribe2 = jest.fn();

    const { rerender } = renderHook<void, { key: string }>(
      ({ key }) =>
        useFirestoreSubscription(key, () =>
          key === 'expenses_2026-07' ? mockUnsubscribe1 : mockUnsubscribe2
        ),
      { initialProps: { key: 'expenses_2026-07' } }
    );

    expect(RealtimeSyncManager.hasSubscription('expenses_2026-07')).toBe(true);

    // Switch month key
    rerender({ key: 'expenses_2026-08' });

    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
    expect(RealtimeSyncManager.hasSubscription('expenses_2026-07')).toBe(false);
    expect(RealtimeSyncManager.hasSubscription('expenses_2026-08')).toBe(true);
  });

  it('re-subscribes when dependency array values change', () => {
    const mockUnsubscribe = jest.fn();
    let subCallCount = 0;

    const { rerender } = renderHook<void, { filterId: string }>(
      ({ filterId }) =>
        useFirestoreSubscription(
          `categories_uid_${filterId}`,
          () => {
            subCallCount++;
            return mockUnsubscribe;
          },
          [filterId]
        ),
      { initialProps: { filterId: 'all' } }
    );

    expect(subCallCount).toBe(1);

    // Change dependency
    rerender({ filterId: 'active' });

    expect(subCallCount).toBe(2);
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
