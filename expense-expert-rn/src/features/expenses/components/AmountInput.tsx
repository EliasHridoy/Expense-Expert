import React from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors } from '../../../theme';

export interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  testID?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChangeText,
  error,
  testID = 'amount-input',
}) => {
  const handleChangeText = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    onChangeText(cleaned);
  };

  return (
    <View
      style={styles.card}
      className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50"
      testID={`${testID}-container`}
    >
      <Text style={styles.headerLabel} className="block text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-center">
        Amount
      </Text>
      <View style={styles.inputRow} className="relative flex-row items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 px-4 py-2">
        <Text style={styles.dollarSign} className="text-2xl sm:text-3xl font-bold text-slate-400 dark:text-slate-500 mr-2">
          $
        </Text>
        <TextInput
          testID={testID}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#94a3b8"
          selectTextOnFocus
          style={styles.input}
          className="flex-1 text-3xl sm:text-4xl font-bold text-center text-slate-900 dark:text-slate-100 py-2 outline-none"
        />
      </View>
      {error ? (
        <Text
          testID={`${testID}-error`}
          style={styles.errorText}
          className="text-xs text-rose-500 dark:text-rose-400 text-center mt-2"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dollarSign: {
    fontSize: 32,
    fontWeight: '800',
    color: '#94a3b8',
    marginRight: 6,
  },
  input: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    paddingVertical: 6,
    minWidth: 120,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  errorText: {
    fontSize: 12,
    color: '#e11d48',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
