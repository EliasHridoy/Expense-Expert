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
import { BankAccount, CreateSavingGoalDto, DurationUnit } from '../types/saving.types';
import { colors } from '../../../theme';

export interface AddGoalModalProps {
  visible: boolean;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSubmit: (dto: CreateSavingGoalDto) => Promise<void>;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  bankAccounts,
  onClose,
  onSubmit,
}) => {
  const [purpose, setPurpose] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [durationValue, setDurationValue] = useState('6');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('months');
  const [startMonth, setStartMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [bankAccountId, setBankAccountId] = useState<string>(
    bankAccounts[0]?.id || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setPurpose('');
      setTargetAmount('');
      setDurationValue('6');
      setDurationUnit('months');
      setStartMonth(new Date().toISOString().substring(0, 7));
      setBankAccountId(bankAccounts[0]?.id || '');
      setError(null);
    }
  }, [visible, bankAccounts]);

  const handleSubmit = async () => {
    if (!purpose.trim()) {
      setError('Please provide a goal purpose.');
      return;
    }
    const cleanAmount = targetAmount.replace(/[^0-9.]/g, '');
    const parsedTarget = parseFloat(cleanAmount);
    if (!parsedTarget || parsedTarget <= 0) {
      setError('Please enter a valid target amount.');
      return;
    }
    const parsedDuration = parseInt(durationValue, 10);
    if (!parsedDuration || parsedDuration <= 0) {
      setError('Please enter a valid duration.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        purpose: purpose.trim(),
        targetAmount: parsedTarget,
        durationValue: parsedDuration,
        durationUnit,
        startMonth,
        bankAccountId: bankAccountId || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create saving goal.');
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
        <View style={styles.modalCard} testID="add-goal-modal">
          <View style={styles.header}>
            <Text style={styles.title}>🎯 Create Saving Goal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Goal Purpose */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Goal Purpose</Text>
            <TextInput
              testID="goal-purpose-input"
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g. Emergency Fund, Vacation, New Laptop"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Target Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Amount ($)</Text>
            <TextInput
              testID="goal-target-input"
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="decimal-pad"
              placeholder="e.g. 5000.00"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Duration & Start Month */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                testID="goal-duration-input"
                value={durationValue}
                onChangeText={setDurationValue}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.unitRow}>
                <TouchableOpacity
                  onPress={() => setDurationUnit('months')}
                  style={[styles.unitBtn, durationUnit === 'months' && styles.unitBtnActive]}
                >
                  <Text style={[styles.unitBtnText, durationUnit === 'months' && styles.unitBtnTextActive]}>Months</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDurationUnit('years')}
                  style={[styles.unitBtn, durationUnit === 'years' && styles.unitBtnActive]}
                >
                  <Text style={[styles.unitBtnText, durationUnit === 'years' && styles.unitBtnTextActive]}>Years</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Start Month */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Start Month</Text>
            <TextInput
              testID="goal-start-month-input"
              value={startMonth}
              onChangeText={setStartMonth}
              placeholder="YYYY-MM"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Bank Account Link */}
          {bankAccounts.length > 0 ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Link to Bank Account</Text>
              <View style={styles.bankSelectRow}>
                {bankAccounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setBankAccountId(acc.id)}
                    style={[
                      styles.bankChip,
                      bankAccountId === acc.id && styles.bankChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bankChipText,
                        bankAccountId === acc.id && styles.bankChipTextActive,
                      ]}
                    >
                      🏦 {acc.bankName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="submit-goal-btn"
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Create Goal</Text>
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
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  unitRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    height: 42,
  },
  unitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  unitBtnActive: {
    backgroundColor: '#ffffff',
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  unitBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  bankSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  bankChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  bankChipTextActive: {
    color: '#2563eb',
    fontWeight: '700',
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
