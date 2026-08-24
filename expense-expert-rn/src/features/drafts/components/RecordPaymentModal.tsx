import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { DraftApplication, ExpenseDraft } from '../types/draft.types';
import { colors } from '../../../theme';

export interface RecordPaymentModalProps {
  visible: boolean;
  application: DraftApplication | null;
  draft: ExpenseDraft | null;
  onClose: () => void;
  onSubmit: (application: DraftApplication, amount: number, draft: ExpenseDraft) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  visible,
  application,
  draft,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (application && draft) {
      const remaining = application.targetAmount - application.paidAmount;
      const installmentAmount =
        application.totalInstallments > 0
          ? application.targetAmount / application.totalInstallments
          : remaining;
      setAmount(String(Math.min(remaining, installmentAmount).toFixed(2)));
      setError(null);
    }
  }, [application, draft, visible]);

  if (!application || !draft) return null;

  const handleSubmit = async () => {
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanAmount);
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(application, parsed, draft);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard} testID="record-payment-modal">
          <View style={styles.header}>
            <Text style={styles.title}>⚡ Quick Add / Pay Installment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Draft: {draft.title}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Amount ($)</Text>
            <TextInput
              testID="payment-amount-input"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="e.g. 50.00"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="confirm-payment-btn"
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm & Add Expense</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
      : { elevation: 8 }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  errorText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
