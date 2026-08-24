import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
            style={[styles.badgeContainer, { backgroundColor: '#ffe4e6' }]}
            className={`px-2.5 py-0.5 rounded-full ${colorStyles.badgeBg}`}
          >
            <Text style={[styles.badgeText, { color: '#e11d48' }]}>
              Exceeded by {formatCents(Math.abs(usage.remainingInCents))}
            </Text>
          </View>
        );
      case 'warning':
        return (
          <View
            testID={`${testID}-badge`}
            style={[styles.badgeContainer, { backgroundColor: '#fef3c7' }]}
            className={`px-2.5 py-0.5 rounded-full ${colorStyles.badgeBg}`}
          >
            <Text style={[styles.badgeText, { color: '#d97706' }]}>
              Near Limit (80%+)
            </Text>
          </View>
        );
      case 'under':
      default:
        return (
          <View
            testID={`${testID}-badge`}
            style={[styles.badgeContainer, { backgroundColor: '#ecfdf5' }]}
            className={`px-2.5 py-0.5 rounded-full ${colorStyles.badgeBg}`}
          >
            <Text style={[styles.badgeText, { color: '#059669' }]}>
              On Track
            </Text>
          </View>
        );
    }
  };

  return (
    <View
      testID={testID}
      style={styles.card}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 mb-3 ${className}`}
    >
      {/* Card Header: Category & Status Badge */}
      <View style={styles.headerRow} className="flex-row items-center justify-between mb-3">
        <CategoryBadge category={usage.category} size="md" />
        {getStatusBadge()}
      </View>

      {/* Financial Metrics Row */}
      <View style={styles.metricsRow} className="flex-row justify-between items-baseline mb-2">
        <View>
          <Text style={styles.metricLabel} className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Spent
          </Text>
          <Text
            testID={`${testID}-spent`}
            style={[
              styles.metricValue,
              { color: usage.isExceeded ? '#e11d48' : '#0f172a' },
            ]}
            className={`text-lg font-bold ${usage.isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}
          >
            {formatCents(usage.spentInCents)}
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.metricLabel} className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Limit
          </Text>
          <Text
            testID={`${testID}-limit`}
            style={[styles.metricValue, { color: '#475569' }]}
            className="text-lg font-bold text-slate-700 dark:text-slate-300"
          >
            {formatCents(usage.limitInCents)}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.metricLabel} className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {usage.isExceeded ? 'Over' : 'Remaining'}
          </Text>
          <Text
            testID={`${testID}-remaining`}
            style={[
              styles.metricValue,
              { color: usage.isExceeded ? '#e11d48' : usage.thresholdState === 'warning' ? '#d97706' : '#059669' },
            ]}
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
      <View style={styles.actionsRow} className="flex-row justify-end items-center gap-x-2 pt-2 border-t border-slate-100 dark:border-slate-700/40">
        {onEdit && (
          <TouchableOpacity
            testID={`${testID}-edit-btn`}
            onPress={() => onEdit(usage)}
            style={styles.editBtn}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 active:opacity-70"
          >
            <Text style={styles.editBtnText} className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Edit Limit
            </Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            testID={`${testID}-delete-btn`}
            onPress={() => onDelete(usage.budgetId)}
            style={styles.deleteBtn}
            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 active:opacity-70"
          >
            <Text style={styles.deleteBtnText} className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Remove
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e11d48',
  },
});
