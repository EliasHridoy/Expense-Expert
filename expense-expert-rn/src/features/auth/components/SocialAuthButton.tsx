import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface SocialAuthButtonProps {
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  label?: string;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  testID = 'social-auth-button',
  label = 'Continue with Google',
}) => {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      className={`w-full flex-row items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 shadow-sm ${
        disabled || loading ? 'opacity-50' : 'active:bg-slate-50 dark:active:bg-slate-600'
      }`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#4f46e5" testID="social-auth-loading-indicator" />
      ) : (
        <View className="flex-row items-center justify-center">
          <View className="w-5 h-5 items-center justify-center rounded-full bg-red-500 mr-2.5">
            <Text className="text-white font-bold text-xs">G</Text>
          </View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
