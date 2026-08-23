import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  return (
    <View
      testID="error-boundary-fallback"
      className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-900"
    >
      <View className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/50 shadow-sm items-center">
        <Text className="text-4xl mb-3">⚠️</Text>
        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
          Something went wrong
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mb-6 text-center">
          {error?.message ? error.message : 'An unexpected error occurred while rendering. Your data is safely stored.'}
        </Text>
        <TouchableOpacity
          testID="error-boundary-retry-button"
          onPress={onReset}
          className="w-full bg-indigo-600 dark:bg-indigo-500 py-3 rounded-xl items-center active:opacity-80"
        >
          <Text className="text-white font-bold text-sm">Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
