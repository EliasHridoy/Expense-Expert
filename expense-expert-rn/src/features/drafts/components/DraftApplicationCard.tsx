import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { DraftApplication, DraftApplicationStatus, ExpenseDraft } from '../types/draft.types';
import { CategoryBadge } from '../../categories/components/CategoryBadge';
import { colors } from '../../../theme';

export interface DraftApplicationCardProps {
  application: DraftApplication;
  draft: ExpenseDraft;
  onRecordPayment: (application: DraftApplication, draft: ExpenseDraft) => void;
  testID?: string;
}

export const DraftApplicationCard: React.FC<DraftApplicationCardProps> = ({
  application,
  draft,
  onRecordPayment,
  testID = `draft-app-${application.id}`,
}) => {
  const percentage =
    application.targetAmount > 0
      ? Math.min(100, Math.round((application.paidAmount / application.targetAmount) * 100))
      : 0;

  const isCompleted = application.status === DraftApplicationStatus.Completed;

  const installmentAmount =
    application.totalInstallments > 0
      ? application.targetAmount / application.totalInstallments
      : application.targetAmount;

  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>{draft.title}</Text>
          <View style={styles.metaRow}>
            <CategoryBadge category={draft.category} size="sm" />
            <Text style={styles.installmentMeta}>
              Installment {application.installmentsPaid} / {application.totalInstallments}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            isCompleted ? styles.statusBadgeCompleted : styles.statusBadgePending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isCompleted ? styles.statusTextCompleted : styles.statusTextPending,
            ]}
          >
            {isCompleted ? '✓ Completed' : `${percentage}% Paid`}
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
        <Text style={styles.amountReadout}>
          ${application.paidAmount.toFixed(2)} / ${application.targetAmount.toFixed(2)}
        </Text>
      </View>

      {/* Quick Action */}
      {!isCompleted ? (
        <View style={styles.footerRow}>
          <Text style={styles.nextAmountText}>
            Next installment: ${installmentAmount.toFixed(2)}
          </Text>
          <TouchableOpacity
            testID={`record-payment-btn-${application.id}`}
            onPress={() => onRecordPayment(application, draft)}
            style={styles.payBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.payBtnText}>⚡ Quick Add (${installmentAmount.toFixed(2)})</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.completedRow}>
          <Text style={styles.completedNotice}>🎉 Fully paid for this month!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }
      : { elevation: 2 }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  installmentMeta: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusBadgeCompleted: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusBadgePending: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextCompleted: {
    color: '#059669',
  },
  statusTextPending: {
    color: '#475569',
  },
  progressContainer: {
    gap: 6,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  amountReadout: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  nextAmountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  payBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)', cursor: 'pointer' }
      : { elevation: 1 }),
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  completedRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  completedNotice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
});
