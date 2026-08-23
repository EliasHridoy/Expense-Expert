import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CategoryBadge } from '../../categories/components/CategoryBadge';
import { formatCents } from '../../expenses/utils/currency.util';
import { BudgetUsage } from '../types/budget.types';
import { getThresholdColor } from '../utils/budget.util';
import { BudgetProgressBar } from './BudgetProgressBar';

export interface CategoryBudgetCardProps {
  usage: BudgetUsage;
  onEdit?: (usage: BudgetUsage) => void;
  onDelete?: (budgetId: string) => void;
  className?: string;
  testID?: string;
}

/**
 * Card displaying individual category budget progress, spent/remaining metrics,
 * threshold warnings, and action buttons.
 */
export const CategoryBudgetCard: React.FC<CategoryBudgetCardProps> = ({
  usage,
  onEdit,
  onDelete,
  className = '',
  testID = 'category-budget-card',
}) => {
  const colorStyles = getThresholdColor(usage.thresholdState);

  const getStatusBadge = () => {
    switch (usage.thresholdState) {
      case 'exceeded':
        return (
          <View
            testID={`${testID}-badge`}
            className={`px-2.5 py-0.5 rounded-full ${colorStyles.badgeBg}`}
          >
            <Text className={`text-xs font-bold ${colorStyles.badgeText}`}>
              Exceeded by {formatCents(Math.abs(usage.remainingInCents))}
            </Text>
          </View>
        );
      case 'warning':
        return (
          <View
            testID={`${testID}-badge`}
            className={`px-2.5 py-0.5 rounded-full ${colorStyles.badgeBg}`}
          >
            <Text className={`text-xs font-bold ${colorStyles.badgeText}`}>
              Near Limit (80%+)
            </Text>
          </View>
        );
      case 'under':
      default:
        return (
          <View
            testID={`${testID}-badge`}
            className={`px-2.5 py-0.5 rounded-full ${colorStyles.badgeBg}`}
          >
            <Text className={`text-xs font-semibold ${colorStyles.badgeText}`}>
              On Track
            </Text>
          </View>
        );
    }
  };

  return (
    <View
      testID={testID}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 mb-3 ${className}`}
    >
      {/* Card Header: Category & Status Badge */}
      <View className="flex-row items-center justify-between mb-3">
        <CategoryBadge category={usage.category} size="md" />
        {getStatusBadge()}
      </View>

      {/* Financial Metrics Row */}
      <View className="flex-row justify-between items-baseline mb-2">
        <View>
          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Spent
          </Text>
          <Text
            testID={`${testID}-spent`}
            className={`text-lg font-bold ${usage.isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}
          >
            {formatCents(usage.spentInCents)}
          </Text>
        </View>

        <View className="items-center">
          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Limit
          </Text>
          <Text
            testID={`${testID}-limit`}
            className="text-lg font-bold text-slate-700 dark:text-slate-300"
          >
            {formatCents(usage.limitInCents)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {usage.isExceeded ? 'Over' : 'Remaining'}
          </Text>
          <Text
            testID={`${testID}-remaining`}
            className={`text-lg font-bold ${colorStyles.textColor}`}
          >
            {usage.isExceeded
              ? `-${formatCents(Math.abs(usage.remainingInCents))}`
              : formatCents(usage.remainingInCents)}
          </Text>
        </View>
      </View>

      {/* Visual Progress Bar */}
      <BudgetProgressBar
        percentage={usage.percentage}
        thresholdState={usage.thresholdState}
        showLabel={true}
        className="mb-3"
      />

      {/* Action Buttons */}
      <View className="flex-row justify-end items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700/40">
        {onEdit && (
          <TouchableOpacity
            testID={`${testID}-edit-btn`}
            onPress={() => onEdit(usage)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 active:opacity-70 mr-2"
          >
            <Text className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Edit Limit
            </Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            testID={`${testID}-delete-btn`}
            onPress={() => onDelete(usage.budgetId)}
            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 active:opacity-70"
          >
            <Text className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Remove
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
