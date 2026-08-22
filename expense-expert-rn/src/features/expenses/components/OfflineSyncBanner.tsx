import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';

export interface OfflineSyncBannerProps {
  pendingCount: number;
  isOnline: boolean;
  onSyncNow?: () => void;
  testID?: string;
}

/**
 * Status banner displaying network state and pending offline sync item counts.
 */
export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  pendingCount,
  isOnline,
  onSyncNow,
  testID = 'offline-sync-banner',
}) => {
  if (isOnline && pendingCount === 0) {
    return null;
  }

  const transactionText = pendingCount === 1 ? 'transaction' : 'transactions';

  if (!isOnline) {
    return (
      <View
        testID={testID}
        className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex-row items-center justify-between shadow-sm mb-4"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <Text className="text-base mr-2">📡</Text>
          <View className="flex-1">
            <Text className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Offline Mode
            </Text>
            <Text className="text-xs text-amber-700 dark:text-amber-300">
              {pendingCount > 0
                ? `${pendingCount} ${transactionText} queued locally`
                : 'Transactions will be saved locally'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      testID={testID}
      className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4 flex-row items-center justify-between shadow-sm mb-4"
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Text className="text-base mr-2">🔄</Text>
        <View className="flex-1">
          <Text className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
            Unsynced Transactions
          </Text>
          <Text className="text-xs text-indigo-700 dark:text-indigo-300">
            {pendingCount} {transactionText} pending sync
          </Text>
        </View>
      </View>
      {onSyncNow ? (
        <Pressable
          testID={`${testID}-sync-btn`}
          onPress={onSyncNow}
          className="bg-indigo-600 dark:bg-indigo-500 rounded-xl px-3 py-1.5 active:opacity-80"
        >
          <Text className="text-xs font-bold text-white">Sync Now</Text>
        </Pressable>
      ) : null}
    </View>
  );
};
