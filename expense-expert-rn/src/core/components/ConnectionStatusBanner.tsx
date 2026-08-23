import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNetworkStatus } from '../../features/expenses/hooks/useNetworkStatus';
import { useExpenses } from '../../features/expenses/hooks/useExpenses';

export interface ConnectionStatusBannerProps {
  pendingCount?: number;
  isSyncing?: boolean;
  onSyncNow?: () => void | Promise<any>;
  testID?: string;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  pendingCount: propPendingCount,
  isSyncing: propIsSyncing,
  onSyncNow: propOnSyncNow,
  testID = 'connection-status-banner',
}) => {
  const { isOnline } = useNetworkStatus();

  let contextPendingCount = 0;
  let contextIsSyncing = false;
  let contextSyncQueue: (() => Promise<number>) | undefined;

  try {
    const expenseContext = useExpenses();
    contextPendingCount = expenseContext.pendingSyncCount;
    contextIsSyncing = expenseContext.isSyncing;
    contextSyncQueue = expenseContext.syncQueue;
  } catch {
    // Rendered outside ExpenseProvider
  }

  const pendingCount = propPendingCount !== undefined ? propPendingCount : contextPendingCount;
  const isSyncing = propIsSyncing !== undefined ? propIsSyncing : contextIsSyncing;
  const onSyncNow = propOnSyncNow || contextSyncQueue;

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  if (!isOnline) {
    return (
      <View
        testID={testID}
        accessibilityRole="alert"
        className="bg-amber-500 dark:bg-amber-600 px-4 py-2.5 flex-row items-center justify-between shadow-sm z-10"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <Text className="text-white text-sm mr-2 font-bold">⚠️</Text>
          <Text
            testID="offline-banner-text"
            className="text-white text-xs font-semibold flex-1"
          >
            You are offline. Changes are saved locally.
          </Text>
        </View>
        {pendingCount > 0 && (
          <View
            testID="offline-pending-badge"
            className="bg-amber-700/60 dark:bg-amber-800/60 px-2 py-0.5 rounded-full"
          >
            <Text className="text-white text-[10px] font-bold">
              {pendingCount} {pendingCount === 1 ? 'queued' : 'queued'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  const itemText = pendingCount === 1 ? 'change' : 'changes';

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      className="bg-indigo-600 dark:bg-indigo-700 px-4 py-2.5 flex-row items-center justify-between shadow-sm z-10"
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Text className="text-white text-sm mr-2">🔄</Text>
        <Text
          testID="pending-sync-text"
          className="text-white text-xs font-semibold flex-1"
        >
          {isSyncing
            ? 'Syncing changes...'
            : `${pendingCount} ${itemText} waiting to sync`}
        </Text>
      </View>
      {isSyncing ? (
        <ActivityIndicator
          testID="sync-spinner"
          size="small"
          color="#ffffff"
        />
      ) : onSyncNow ? (
        <TouchableOpacity
          testID="sync-now-button"
          onPress={() => onSyncNow()}
          activeOpacity={0.8}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg"
        >
          <Text className="text-white text-xs font-bold">Sync Now</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
