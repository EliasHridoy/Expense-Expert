import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ExpenseDraft } from '../types/draft.types';
import { CategoryBadge } from '../../categories/components/CategoryBadge';
import { colors } from '../../../theme';

export interface DraftCardProps {
  draft: ExpenseDraft;
  isApplied?: boolean;
  onApply: (draft: ExpenseDraft) => void;
  onDelete?: (draft: ExpenseDraft) => void;
  testID?: string;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  draft,
  isApplied = false,
  onApply,
  onDelete,
  testID = `draft-card-${draft.id}`,
}) => {
  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.draftTitle} numberOfLines={1}>
            {draft.title}
          </Text>
          <View style={styles.tagRow}>
            <CategoryBadge category={draft.category} size="sm" />
            {draft.installmentCount > 1 ? (
              <View style={styles.installmentBadge}>
                <Text style={styles.installmentText}>
                  {draft.installmentCount} installments
                </Text>
              </View>
            ) : null}
            {draft.isLoan ? (
              <View style={styles.loanBadge}>
                <Text style={styles.loanText}>🤝 Loan</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.targetAmount}>
          ${draft.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>

      {draft.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {draft.description}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        {onDelete ? (
          <TouchableOpacity
            testID={`delete-draft-btn-${draft.id}`}
            onPress={() => onDelete(draft)}
            style={styles.deleteBtn}
            accessibilityLabel="Delete draft template"
          >
            <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
          </TouchableOpacity>
        ) : <View />}

        <TouchableOpacity
          testID={`apply-draft-btn-${draft.id}`}
          onPress={() => onApply(draft)}
          disabled={isApplied}
          style={[styles.applyBtn, isApplied && styles.applyBtnDisabled]}
          activeOpacity={0.8}
        >
          <Text style={[styles.applyBtnText, isApplied && styles.applyBtnTextDisabled]}>
            {isApplied ? '✓ Applied for Month' : '+ Apply to Month'}
          </Text>
        </TouchableOpacity>
      </View>
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
      ? { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }
      : { elevation: 1 }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  installmentBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  installmentText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  loanBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  loanText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '700',
  },
  targetAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#e11d48',
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  applyBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  applyBtnTextDisabled: {
    color: '#94a3b8',
  },
});
