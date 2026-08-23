import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

export interface ExpenseSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  testID?: string;
}

export const ExpenseSearchBar: React.FC<ExpenseSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search expenses by title or note...',
  onClear,
  testID = 'expense-search-bar',
}) => {
  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View
      testID={testID}
      className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700"
    >
      <Text className="text-base mr-2 text-slate-400">🔍</Text>
      <TextInput
        testID="expense-search-input"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Search expenses"
        className="flex-1 text-slate-900 dark:text-white text-base py-0.5"
      />
      {Boolean(value) && (
        <TouchableOpacity
          testID="clear-search-button"
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          className="p-1 ml-1 rounded-full bg-slate-200 dark:bg-slate-700"
        >
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
