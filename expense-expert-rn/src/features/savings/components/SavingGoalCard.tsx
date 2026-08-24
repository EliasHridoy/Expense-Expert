import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SavingGoal } from '../types/saving.types';
import { colors } from '../../../theme';

export interface SavingGoalCardProps {
  goal: SavingGoal;
  bankAccountName?: string;
  onDeposit: (goal: SavingGoal) => void;
  onWithdraw: (goal: SavingGoal) => void;
  onEdit?: (goal: SavingGoal) => void;
  onDelete?: (goal: SavingGoal) => void;
  testID?: string;
}

export const SavingGoalCard: React.FC<SavingGoalCardProps> = ({
  goal,
  bankAccountName,
  onDeposit,
  onWithdraw,
  onEdit,
  onDelete,
  testID = `saving-goal-${goal.id}`,
}) => {
  const percentage =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
      : 0;

  const isCompleted = goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0;

  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.goalIcon}>🎯</Text>
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.purposeText} numberOfLines={1}>
              {goal.purpose}
            </Text>
            <Text style={styles.timeframeText}>
              {goal.startMonth} ➔ {goal.endMonth} ({goal.durationValue} {goal.durationUnit})
            </Text>
          </View>
        </View>

        {isCompleted ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Achieved</Text>
          </View>
        ) : null}
      </View>

      {/* Amounts */}
      <View style={styles.amountRow}>
        <View>
          <Text style={styles.amountLabel}>Saved</Text>
          <Text style={styles.savedAmountText}>
            ${goal.savedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.targetCol}>
          <Text style={styles.amountLabel}>Target</Text>
          <Text style={styles.targetAmountText}>
            ${goal.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: isCompleted ? '#059669' : colors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>

      {bankAccountName ? (
        <Text style={styles.bankLinkedText}>🏦 Linked to: {bankAccountName}</Text>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          testID={`deposit-btn-${goal.id}`}
          onPress={() => onDeposit(goal)}
          style={styles.depositBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.depositBtnText}>+ Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID={`withdraw-btn-${goal.id}`}
          onPress={() => onWithdraw(goal)}
          style={styles.withdrawBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.withdrawBtnText}>- Withdraw</Text>
        </TouchableOpacity>

        {onDelete ? (
          <TouchableOpacity
            testID={`delete-goal-btn-${goal.id}`}
            onPress={() => onDelete(goal)}
            style={styles.deleteGoalBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteGoalBtnText}>🗑️</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)' }
      : { elevation: 2 }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIcon: {
    fontSize: 22,
  },
  titleCol: {
    flex: 1,
  },
  purposeText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  timeframeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  savedAmountText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
  },
  targetCol: {
    alignItems: 'flex-end',
  },
  targetAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    width: 38,
    textAlign: 'right',
  },
  bankLinkedText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  depositBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  depositBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  withdrawBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  withdrawBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteGoalBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  deleteGoalBtnText: {
    fontSize: 14,
  },
});
