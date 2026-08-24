import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme';

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
      style={[
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      className={`w-full flex-row items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 shadow-sm ${
        disabled || loading ? 'opacity-50' : 'active:bg-slate-50 dark:active:bg-slate-600'
      }`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} testID="social-auth-loading-indicator" />
      ) : (
        <View style={styles.contentRow} className="flex-row items-center justify-center">
          <View style={styles.iconCircle} className="w-5 h-5 items-center justify-center rounded-full bg-red-500 mr-2.5">
            <Text style={styles.iconText} className="text-white font-bold text-xs">G</Text>
          </View>
          <Text style={styles.labelText} className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', cursor: 'pointer' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ea4335',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
