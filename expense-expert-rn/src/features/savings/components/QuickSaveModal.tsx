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
import { SavingGoal, SavingEntryType } from '../types/saving.types';
import { colors } from '../../../theme';

export interface QuickSaveModalProps {
  visible: boolean;
  goal: SavingGoal | null;
  initialType?: SavingEntryType;
  onClose: () => void;
  onSubmit: (data: {
    goalId: string;
    amount: number;
    type: SavingEntryType;
    date: string;
    note?: string;
  }) => Promise<void>;
}

export const QuickSaveModal: React.FC<QuickSaveModalProps> = ({
  visible,
  goal,
  initialType = 'deposit',
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<SavingEntryType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial type when opened
  React.useEffect(() => {
    setType(initialType);
    setAmount('');
    setNote('');
    setError(null);
  }, [visible, initialType]);

  if (!goal) return null;

  const handleSubmit = async () => {
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanAmount);
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (type === 'withdrawal' && parsed > goal.savedAmount) {
      setError(`Cannot withdraw more than saved amount ($${goal.savedAmount}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        goalId: goal.id,
        amount: parsed,
        type,
        date,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record saving entry.');
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
        <View style={styles.modalCard} testID="quick-save-modal">
          <View style={styles.header}>
            <Text style={styles.title}>
              {type === 'deposit' ? '💰 Deposit Savings' : '💸 Withdraw Savings'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Goal: {goal.purpose}</Text>

          {/* Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              testID="type-deposit-btn"
              onPress={() => setType('deposit')}
              style={[styles.toggleBtn, type === 'deposit' && styles.toggleBtnActive]}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  type === 'deposit' && styles.toggleBtnTextActive,
                ]}
              >
                Deposit (+Save)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="type-withdrawal-btn"
              onPress={() => setType('withdrawal')}
              style={[styles.toggleBtn, type === 'withdrawal' && styles.toggleBtnActive]}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  type === 'withdrawal' && styles.toggleBtnTextActive,
                ]}
              >
                Withdraw (-Use)
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount ($)</Text>
            <TextInput
              testID="saving-amount-input"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="e.g. 250.00"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              testID="saving-date-input"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Note Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (Optional)</Text>
            <TextInput
              testID="saving-note-input"
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Monthly transfer from checking"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="confirm-save-btn"
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {type === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                </Text>
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
      ? { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }
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
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.06)' } : { elevation: 1 }),
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: colors.primary,
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
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
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
