import React from 'react';
import {
  Text,
  TextInput,
  View,
} from 'react-native';

export interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  testID?: string;
}

/**
 * Large-format currency input component with safe decimal formatting.
 */
export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChangeText,
  error,
  testID = 'amount-input',
}) => {
  const handleChangeText = (text: string) => {
    // Strip non-numeric and non-decimal characters, allow only one decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    onChangeText(cleaned);
  };

  return (
    <View
      className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50"
      testID={`${testID}-container`}
    >
      <Text className="block text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-center">
        Amount
      </Text>
      <View className="relative flex-row items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 px-4 py-2">
        <Text className="text-2xl sm:text-3xl font-bold text-slate-400 dark:text-slate-500 mr-2">
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
          className="flex-1 text-3xl sm:text-4xl font-bold text-center text-slate-900 dark:text-slate-100 py-2 outline-none"
        />
      </View>
      {error ? (
        <Text
          testID={`${testID}-error`}
          className="text-xs text-rose-500 dark:text-rose-400 text-center mt-2"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};
