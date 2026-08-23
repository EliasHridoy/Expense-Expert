import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface ActionShortcutsProps {
  onAddExpense?: () => void;
  onNavigateBudgets?: () => void;
  onNavigateCategories?: () => void;
  className?: string;
  testID?: string;
}

/**
 * Quick Action Shortcuts providing high-frequency financial workflows:
 * Track new expense, jump to monthly budgets, or manage custom categories.
 */
export const ActionShortcuts: React.FC<ActionShortcutsProps> = ({
  onAddExpense,
  onNavigateBudgets,
  onNavigateCategories,
  className = '',
  testID = 'action-shortcuts',
}) => {
  return (
    <View
      testID={testID}
      className={`w-full flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}
    >
      {/* Primary Action: Add Expense */}
      {onAddExpense && (
        <TouchableOpacity
          testID="quick-add-expense-btn"
          onPress={onAddExpense}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Track Expense"
          className="flex-1 bg-indigo-600 active:bg-indigo-700 dark:bg-indigo-600 dark:active:bg-indigo-500 rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
        >
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3">
              <Text className="text-xl text-white font-black">+</Text>
            </View>
            <View>
              <Text className="text-white font-extrabold text-base">
                Track Expense
              </Text>
              <Text className="text-indigo-100 text-xs font-medium">
                Record new transaction
              </Text>
            </View>
          </View>
          <Text className="text-white font-black text-lg">›</Text>
        </TouchableOpacity>
      )}

      {/* Secondary Action Grid/Row */}
      <View className="flex-row gap-3">
        {onNavigateBudgets && (
          <TouchableOpacity
            testID="nav-budgets-btn"
            onPress={onNavigateBudgets}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Navigate to Budgets"
            className="flex-1 sm:flex-initial bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl px-4 py-3.5 flex-row items-center space-x-2 shadow-xs active:bg-slate-50 dark:active:bg-slate-700"
          >
            <Text className="text-lg mr-2">🎯</Text>
            <View>
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Budgets
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Limits
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {onNavigateCategories && (
          <TouchableOpacity
            testID="nav-categories-btn"
            onPress={onNavigateCategories}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Navigate to Categories"
            className="flex-1 sm:flex-initial bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl px-4 py-3.5 flex-row items-center space-x-2 shadow-xs active:bg-slate-50 dark:active:bg-slate-700"
          >
            <Text className="text-lg mr-2">🏷️</Text>
            <View>
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Categories
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Tags
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
