import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../../../theme';

export interface ActionShortcutsProps {
  onAddExpense?: () => void;
  onNavigateBudgets?: () => void;
  onNavigateCategories?: () => void;
  className?: string;
  testID?: string;
}

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
      style={styles.container}
      className={`w-full flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}
    >
      {/* Primary Action: Add Expense */}
      {onAddExpense && (
        <TouchableOpacity
          testID="quick-add-expense-btn"
          onPress={onAddExpense}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Track Expense"
          style={styles.primaryBtn}
          className="flex-1 bg-indigo-600 active:bg-indigo-700 dark:bg-indigo-600 dark:active:bg-indigo-500 rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
        >
          <View style={styles.primaryLeft} className="flex-row items-center gap-x-3">
            <View style={styles.plusBox} className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3">
              <Text style={styles.plusText} className="text-xl text-white font-black">+</Text>
            </View>
            <View>
              <Text style={styles.primaryTitle} className="text-white font-extrabold text-base">
                Track Expense
              </Text>
              <Text style={styles.primarySubtitle} className="text-indigo-100 text-xs font-medium">
                Record new transaction
              </Text>
            </View>
          </View>
          <Text style={styles.chevron} className="text-white font-black text-lg">›</Text>
        </TouchableOpacity>
      )}

      {/* Secondary Action Grid/Row */}
      <View style={styles.secondaryRow} className="flex-row gap-3">
        {onNavigateBudgets && (
          <TouchableOpacity
            testID="nav-budgets-btn"
            onPress={onNavigateBudgets}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Navigate to Budgets"
            style={styles.secondaryBtn}
            className="flex-1 sm:flex-initial bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl px-4 py-3.5 flex-row items-center gap-x-2 shadow-xs active:bg-slate-50 dark:active:bg-slate-700"
          >
            <Text style={styles.secondaryIcon} className="text-lg mr-2">🎯</Text>
            <View>
              <Text style={styles.secondaryTitle} className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Budgets
              </Text>
              <Text style={styles.secondarySubtitle} className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Limits
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {onNavigateCategories && (
          <TouchableOpacity
            testID="nav-categories-btn"
            onPress={onNavigateCategories}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Navigate to Categories"
            style={styles.secondaryBtn}
            className="flex-1 sm:flex-initial bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl px-4 py-3.5 flex-row items-center gap-x-2 shadow-xs active:bg-slate-50 dark:active:bg-slate-700"
          >
            <Text style={styles.secondaryIcon} className="text-lg mr-2">🏷️</Text>
            <View>
              <Text style={styles.secondaryTitle} className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Categories
              </Text>
              <Text style={styles.secondarySubtitle} className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Tags
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 18px rgba(79, 70, 229, 0.3)', cursor: 'pointer' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  primaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  plusText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  primaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  primarySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    width: Platform.OS === 'web' ? 'auto' : '100%',
  },
  secondaryBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: Platform.OS === 'web' ? undefined : 1,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', cursor: 'pointer' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }),
  },
  secondaryIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  secondaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  secondarySubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
});
