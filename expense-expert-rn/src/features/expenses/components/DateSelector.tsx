import React from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { formatDisplayDate, toDateInputValue } from '../utils/date.util';

export interface DateSelectorProps {
  value: string; // "YYYY-MM-DD"
  onChange: (dateStr: string) => void;
  label?: string;
  testID?: string;
}

/**
 * Universal cross-platform date selection component.
 */
export const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  onChange,
  label = 'Date',
  testID = 'date-selector',
}) => {
  const todayStr = toDateInputValue(new Date());
  const yesterdayStr = toDateInputValue(new Date(Date.now() - 86400000));

  const displayDate = value ? formatDisplayDate(value) : formatDisplayDate(new Date());

  return (
    <View testID={testID} className="gap-y-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </Text>
        <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {displayDate}
        </Text>
      </View>

      <View className="flex-row items-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
        <Text className="text-base mr-2">📅</Text>
        <TextInput
          testID={`${testID}-input`}
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
          maxLength={10}
          className="flex-1 text-sm text-slate-900 dark:text-slate-100 py-1 outline-none"
          {...(Platform.OS === 'web' ? ({ type: 'date' } as any) : {})}
        />
      </View>

      {/* Quick Select Buttons */}
      <View className="flex-row gap-2 pt-1">
        <Pressable
          testID={`${testID}-today-btn`}
          onPress={() => onChange(todayStr)}
          className={`rounded-full px-3 py-1 border ${
            value === todayStr
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700'
              : 'bg-slate-100 dark:bg-slate-700 border-transparent'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              value === todayStr
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Today
          </Text>
        </Pressable>

        <Pressable
          testID={`${testID}-yesterday-btn`}
          onPress={() => onChange(yesterdayStr)}
          className={`rounded-full px-3 py-1 border ${
            value === yesterdayStr
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700'
              : 'bg-slate-100 dark:bg-slate-700 border-transparent'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              value === yesterdayStr
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Yesterday
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
