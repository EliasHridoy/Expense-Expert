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
import { CreateBankAccountDto } from '../types/saving.types';
import { colors } from '../../../theme';

export interface AddBankAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateBankAccountDto) => Promise<void>;
}

export const AddBankAccountModal: React.FC<AddBankAccountModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setBankName('');
      setAccountName('');
      setAccountNumber('');
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setError('Please fill in all bank account fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add bank account.');
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
        <View style={styles.modalCard} testID="add-bank-modal">
          <View style={styles.header}>
            <Text style={styles.title}>🏦 Add Bank Account</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Bank Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              testID="bank-name-input"
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. Chase, Bank of America, HSBC"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Account Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Name / Label</Text>
            <TextInput
              testID="bank-account-name-input"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g. High-Yield Savings, Emergency Stash"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>

          {/* Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              testID="bank-account-number-input"
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="e.g. 1234567890"
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
              testID="submit-bank-btn"
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Add Account</Text>
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
