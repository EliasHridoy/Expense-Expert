import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { formatCents } from '../../expenses/utils/currency.util';
import { BudgetSummary } from '../types/budget.types';
import { getThresholdColor } from '../utils/budget.util';
import { BudgetProgressBar } from './BudgetProgressBar';
import { colors } from '../../../theme';

export interface BudgetSummaryCardProps {
  summary: BudgetSummary;
  activeMonth: string;
  onAddBudget?: () => void;
  className?: string;
  testID?: string;
}

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
      style={styles.card}
      className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-md border border-slate-100 dark:border-slate-700/50 mb-4 ${className}`}
    >
      {/* Header */}
      <View style={styles.headerRow} className="flex-row justify-between items-center mb-4">
        <View>
          <Text style={styles.subHeader} className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Monthly Budget Overview
          </Text>
          <Text
            testID={`${testID}-month`}
            style={styles.monthTitle}
            className="text-xl font-extrabold text-slate-900 dark:text-white"
          >
            {formatMonthTitle(activeMonth)}
          </Text>
        </View>

        {onAddBudget && (
          <TouchableOpacity
            testID={`${testID}-add-btn`}
            onPress={onAddBudget}
            style={styles.addBtn}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 active:bg-indigo-700 flex-row items-center shadow-sm"
          >
            <Text style={styles.addBtnText} className="text-white font-bold text-xs">+ Set Budget</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Metric Cards */}
      <View style={styles.metricsBox} className="flex-row bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3.5 mb-4 justify-between items-center">
        <View style={{ flex: 1 }}>
          <Text style={styles.metricLabel} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Spent
          </Text>
          <Text
            testID={`${testID}-spent`}
            style={[styles.metricValue, { color: isOver ? '#e11d48' : '#0f172a' }]}
            className={`text-lg font-extrabold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}
          >
            {formatCents(summary.totalSpentInCents)}
          </Text>
        </View>

        <View style={styles.divider} className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.metricLabel} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Limit
          </Text>
          <Text
            testID={`${testID}-limit`}
            style={[styles.metricValue, { color: '#475569' }]}
            className="text-lg font-extrabold text-slate-700 dark:text-slate-300"
          >
            {formatCents(summary.totalLimitInCents)}
          </Text>
        </View>

        <View style={styles.divider} className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.metricLabel} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isOver ? 'Over By' : 'Remaining'}
          </Text>
          <Text
            testID={`${testID}-remaining`}
            style={[
              styles.metricValue,
              { color: isOver ? '#e11d48' : summary.thresholdState === 'warning' ? '#d97706' : '#059669' },
            ]}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    width: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  divider: {
    height: 32,
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
});
