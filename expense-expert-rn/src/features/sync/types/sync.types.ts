export type Unsubscribe = () => void;

export type SubscriptionCallback<T = any> = (data: T) => void;

export interface SubscriptionEntry {
  key: string;
  unsubscribe: Unsubscribe;
  subscriberCount: number;
  createdAt: number;
}

export interface SubscriptionOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export interface SyncState {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncedAt: number | null;
}
