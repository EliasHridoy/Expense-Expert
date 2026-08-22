import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useExpenses } from '../../src/features/expenses/hooks/useExpenses';
import { OfflineSyncBanner } from '../../src/features/expenses/components/OfflineSyncBanner';
import { BUILTIN_CATEGORY_ICONS } from '../../src/features/expenses/types/category.types';
import { formatCents } from '../../src/features/expenses/utils/currency.util';
import { formatDisplayDate } from '../../src/features/expenses/utils/date.util';

export default function AppDashboardScreen() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const {
    expenses,
    pendingSyncCount,
    isOnline,
    isSyncing,
    syncQueue,
  } = useExpenses();

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
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView
        contentContainerStyle={{ padding: 16, alignItems: 'center' }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg space-y-6">
          {/* Header Card */}
          <View className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View
                  testID="app-brand-badge"
                  className="items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 shadow-md"
                >
                  <Text className="text-white font-bold text-lg">EE</Text>
                </View>
                <View>
                  <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Welcome, {displayName}!
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Expense Expert Dashboard
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                testID="logout-button"
                onPress={handleLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
                className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-1.5"
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#dc2626" testID="logout-loading" />
                ) : (
                  <Text className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Sign out
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* User Info Details Badge */}
            <View className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3.5 border border-slate-200 dark:border-slate-600">
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Account Details
              </Text>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-slate-500 dark:text-slate-400">Email:</Text>
                <Text
                  testID="user-email-text"
                  className="text-xs font-medium text-slate-900 dark:text-slate-100"
                >
                  {user?.email || 'N/A'}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-slate-500 dark:text-slate-400">Name:</Text>
                <Text
                  testID="user-name-text"
                  className="text-xs font-medium text-slate-900 dark:text-slate-100"
                >
                  {displayName}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-slate-500 dark:text-slate-400">UID:</Text>
                <Text
                  testID="user-uid-text"
                  className="text-[11px] font-mono text-slate-600 dark:text-slate-300 max-w-[200px]"
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {user?.uid || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Offline Sync Banner */}
          <OfflineSyncBanner
            pendingCount={pendingSyncCount}
            isOnline={isOnline}
            onSyncNow={syncQueue}
          />

          {/* Quick Action Card */}
          <View className="w-full bg-gradient-to-r bg-indigo-600 rounded-2xl p-5 shadow-md flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-base font-bold text-white mb-0.5">
                Track an Expense
              </Text>
              <Text className="text-xs text-indigo-100">
                Log purchases quickly with auto-categorization
              </Text>
            </View>
            <TouchableOpacity
              testID="quick-add-expense-btn"
              onPress={() => router.push('/expenses/new')}
              activeOpacity={0.85}
              className="bg-white rounded-xl px-4 py-2.5 shadow-sm"
              accessibilityRole="button"
              accessibilityLabel="Add Expense"
            >
              <Text className="text-xs font-bold text-indigo-600">
                + Add Expense
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Transactions Section */}
          <View className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Transactions
              </Text>
              {isSyncing ? (
                <View className="flex-row items-center gap-1.5">
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    Syncing...
                  </Text>
                </View>
              ) : (
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {expenses.length} {expenses.length === 1 ? 'record' : 'records'}
                </Text>
              )}
            </View>

            {expenses.length === 0 ? (
              <View
                testID="empty-expenses-message"
                className="py-8 items-center justify-center px-4"
              >
                <Text className="text-3xl mb-2">🧾</Text>
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center mb-1">
                  No expenses recorded yet
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
                  Tap '+ Add Expense' to log your first transaction.
                </Text>
                <TouchableOpacity
                  testID="empty-add-expense-btn"
                  onPress={() => router.push('/expenses/new')}
                  className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-4 py-2"
                >
                  <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    + Add First Expense
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="space-y-3" testID="recent-expenses-list">
                {expenses.map((expense) => {
                  const icon = BUILTIN_CATEGORY_ICONS[expense.category] || '📁';
                  const isPending = expense.syncStatus === 'pending';

                  return (
                    <Pressable
                      key={expense.id}
                      testID={`expense-item-${expense.id}`}
                      onPress={() => router.push(`/expenses/${expense.id}`)}
                      className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 active:bg-slate-100 dark:active:bg-slate-700/70 border border-slate-100 dark:border-slate-700/60"
                    >
                      <View className="flex-row items-center flex-1 mr-3">
                        <View className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-xs border border-slate-200/50 dark:border-slate-700">
                          <Text className="text-lg">{icon}</Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                          >
                            {expense.title}
                          </Text>
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDisplayDate(expense.date)}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatCents(expense.amountInCents)}
                        </Text>
                        {isPending ? (
                          <View
                            testID={`expense-pending-badge-${expense.id}`}
                            className="bg-amber-100 dark:bg-amber-950/60 rounded px-1.5 py-0.5 mt-0.5"
                          >
                            <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                              Pending
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
