import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BankAccount } from '../types/saving.types';
import { colors } from '../../../theme';

export interface BankAccountCardProps {
  account: BankAccount;
  onEdit?: (account: BankAccount) => void;
  onDelete?: (account: BankAccount) => void;
  testID?: string;
}

export const BankAccountCard: React.FC<BankAccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  testID = `bank-account-${account.id}`,
}) => {
  const maskedNumber =
    account.accountNumber.length > 4
      ? `•••• ${account.accountNumber.slice(-4)}`
      : account.accountNumber;

  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.bankIcon}>🏦</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.bankName} numberOfLines={1}>{account.bankName}</Text>
          <Text style={styles.accountName} numberOfLines={1}>{account.accountName}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.accountNumber}>{maskedNumber}</Text>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(account)}
              style={styles.editBtn}
              accessibilityLabel="Edit bank account"
            >
              <Text style={styles.actionBtnText}>✏️</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(account)}
              style={styles.deleteBtn}
              accessibilityLabel="Delete bank account"
            >
              <Text style={styles.actionBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    minWidth: 240,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }
      : { elevation: 1 }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankIcon: {
    fontSize: 20,
  },
  infoCol: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  accountName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  accountNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  actionBtnText: {
    fontSize: 14,
  },
});
