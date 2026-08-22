import React, { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/features/auth/hooks/useAuth';

export default function AppDashboardScreen() {
  const { user, profile, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 justify-center items-center p-4 sm:p-6">
      <View className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-slate-700 items-center">
        {/* Brand Header */}
        <View
          testID="app-brand-badge"
          className="items-center justify-center h-14 w-14 rounded-2xl bg-primary-600 shadow-md mb-4"
        >
          <Text className="text-white font-bold text-xl">EE</Text>
        </View>

        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1 text-center">
          Welcome, {displayName}!
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Expense Expert Dashboard
        </Text>

        {/* User Info Details Badge */}
        <View className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-600">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Account Details
          </Text>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">Email:</Text>
            <Text
              testID="user-email-text"
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              {user?.email || 'N/A'}
            </Text>
          </View>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">Name:</Text>
            <Text
              testID="user-name-text"
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              {displayName}
            </Text>
          </View>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">UID:</Text>
            <Text
              testID="user-uid-text"
              className="text-xs font-mono text-slate-600 dark:text-slate-300 max-w-[200px]"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {user?.uid || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Action Button: Sign Out */}
        <TouchableOpacity
          testID="logout-button"
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
          className="w-full items-center justify-center rounded-lg bg-red-600 active:bg-red-700 px-4 py-2.5 shadow-sm"
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#ffffff" testID="logout-loading" />
          ) : (
            <Text className="text-sm font-medium text-white">Sign out</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
