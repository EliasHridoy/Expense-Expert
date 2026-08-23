import { useEffect, useRef } from 'react';
import { RealtimeSyncManager } from '../services/RealtimeSyncManager';
import { SubscriptionOptions, Unsubscribe } from '../types/sync.types';

/**
 * React hook that binds a Firestore subscription lifecycle to the calling component.
 * Automatically handles registering with RealtimeSyncManager on mount or dependency changes,
 * and deterministic unsubscription on unmount.
 *
 * @param key Composite query key (e.g. `expenses_uid123_2026-08`). If null/undefined, subscription is skipped.
 * @param subscribeFn Callback function returning an unsubscribe handler (e.g. `onSnapshot`).
 * @param deps Additional dependency array triggering re-subscription when changed.
 * @param options Subscription configuration (e.g. `enabled`).
 */
export function useFirestoreSubscription(
  key: string | null | undefined,
  subscribeFn: () => Unsubscribe,
  deps: React.DependencyList = [],
  options: SubscriptionOptions = { enabled: true }
): void {
  const enabled = options.enabled !== false && Boolean(key);
  const subscribeFnRef = useRef(subscribeFn);
  subscribeFnRef.current = subscribeFn;

  useEffect(() => {
    if (!enabled || !key) return;

    const unsubscribe = RealtimeSyncManager.register(key, () => {
      return subscribeFnRef.current();
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, ...deps]);
}
