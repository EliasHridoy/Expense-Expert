import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatCents } from '../../expenses/utils/currency.util';
import { BudgetSummary } from '../types/budget.types';
import { getThresholdColor } from '../utils/budget.util';
import { BudgetProgressBar } from './BudgetProgressBar';

export interface BudgetSummaryCardProps {
  summary: BudgetSummary;
  activeMonth: string;
  onAddBudget?: () => void;
  className?: string;
  testID?: string;
}

/**
 * Summary card providing global monthly budget allocation,
 * total spent, remaining balance, and aggregate progress bar.
 */
export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  summary,
  activeMonth,
  onAddBudget,
  className = '',
  testID = 'budget-summary-card',
}) => {
  const colorStyles = getThresholdColor(summary.thresholdState);
  const isOver = summary.thresholdState === 'exceeded';

  const formatMonthTitle = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  return (
    <View
      testID={testID}
      className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-md border border-slate-100 dark:border-slate-700/50 mb-4 ${className}`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Monthly Budget Overview
          </Text>
          <Text
            testID={`${testID}-month`}
            className="text-xl font-extrabold text-slate-900 dark:text-white"
          >
            {formatMonthTitle(activeMonth)}
          </Text>
        </View>

        {onAddBudget && (
          <TouchableOpacity
            testID={`${testID}-add-btn`}
            onPress={onAddBudget}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 active:bg-indigo-700 flex-row items-center shadow-sm"
          >
            <Text className="text-white font-bold text-xs">+ Set Budget</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Metric Cards */}
      <View className="flex-row bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3.5 mb-4 justify-between items-center">
        <View className="flex-1">
          <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Spent
          </Text>
          <Text
            testID={`${testID}-spent`}
            className={`text-lg font-extrabold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}
          >
            {formatCents(summary.totalSpentInCents)}
          </Text>
        </View>

        <View className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

        <View className="flex-1 items-center">
          <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Limit
          </Text>
          <Text
            testID={`${testID}-limit`}
            className="text-lg font-extrabold text-slate-700 dark:text-slate-300"
          >
            {formatCents(summary.totalLimitInCents)}
          </Text>
        </View>

        <View className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

        <View className="flex-1 items-end">
          <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isOver ? 'Over By' : 'Remaining'}
          </Text>
          <Text
            testID={`${testID}-remaining`}
            className={`text-lg font-extrabold ${colorStyles.textColor}`}
          >
            {isOver
              ? `-${formatCents(Math.abs(summary.totalRemainingInCents))}`
              : formatCents(summary.totalRemainingInCents)}
          </Text>
        </View>
      </View>

      {/* Overall Progress Bar */}
      <BudgetProgressBar
        percentage={summary.percentage}
        thresholdState={summary.thresholdState}
        showLabel={true}
        heightClass="h-3"
      />
    </View>
  );
};
