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
import { CreateDraftDto } from '../types/draft.types';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../../expenses/types/category.types';
import { colors } from '../../../theme';

export interface CreateDraftModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateDraftDto) => Promise<void>;
}

export const CreateDraftModal: React.FC<CreateDraftModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState<string>(ExpenseCategory.Utilities);
  const [installmentCount, setInstallmentCount] = useState('1');
  const [description, setDescription] = useState('');
  const [isLoan, setIsLoan] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setTitle('');
      setTargetAmount('');
      setCategory(ExpenseCategory.Utilities);
      setInstallmentCount('1');
      setDescription('');
      setIsLoan(false);
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please provide a draft title.');
      return;
    }
    const cleanAmount = targetAmount.replace(/[^0-9.]/g, '');
    const parsedAmount = parseFloat(cleanAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    const parsedInstallments = parseInt(installmentCount, 10);
    if (!parsedInstallments || parsedInstallments <= 0) {
      setError('Please enter a valid installment count.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        targetAmount: parsedAmount,
        category,
        installmentCount: parsedInstallments,
        description: description.trim() || undefined,
        isLoan,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create expense draft.');
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
        <View style={styles.modalCard} testID="create-draft-modal">
          <View style={styles.header}>
            <Text style={styles.title}>📋 Create Expense Draft</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Draft / Bill Title</Text>
            <TextInput
              testID="draft-title-input"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Electricity Bill, Apartment Rent, Netflix"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Target Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount / Total Target ($)</Text>
            <TextInput
              testID="draft-amount-input"
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="decimal-pad"
              placeholder="e.g. 150.00"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Category Picker Chips */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.chipRow}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={[
                    styles.catChip,
                    category === cat.value && styles.catChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      category === cat.value && styles.catChipTextActive,
                    ]}
                  >
                    {cat.icon} {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Installments */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Installment Splits (Default: 1)</Text>
            <TextInput
              testID="draft-installments-input"
              value={installmentCount}
              onChangeText={setInstallmentCount}
              keyboardType="numeric"
              style={styles.textInput}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              testID="draft-desc-input"
              value={description}
              onChangeText={setDescription}
              placeholder="Recurring monthly expense notes..."
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="submit-draft-btn"
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Create Draft</Text>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  catChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  catChipTextActive: {
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
