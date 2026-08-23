import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { format, subDays, startOfMonth, endOfMonth, isValid, parseISO } from 'date-fns';
import { toDateInputValue } from '../utils/date.util';

export interface DateRangeModalProps {
  visible: boolean;
  startDate?: string | null;
  endDate?: string | null;
  onApply: (start: string | null, end: string | null) => void;
  onClose: () => void;
  testID?: string;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  visible,
  startDate = null,
  endDate = null,
  onApply,
  onClose,
  testID = 'date-range-modal',
}) => {
  const [start, setStart] = useState<string>(startDate || '');
  const [end, setEnd] = useState<string>(endDate || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStart(startDate || '');
      setEnd(endDate || '');
      setErrorMessage(null);
    }
  }, [visible, startDate, endDate]);

  const handleApply = () => {
    const trimmedStart = start.trim();
    const trimmedEnd = end.trim();

    if (trimmedStart && trimmedEnd) {
      const parsedStart = parseISO(trimmedStart);
      const parsedEnd = parseISO(trimmedEnd);

      if (!isValid(parsedStart)) {
        setErrorMessage('Start date format is invalid (use YYYY-MM-DD)');
        return;
      }

      if (!isValid(parsedEnd)) {
        setErrorMessage('End date format is invalid (use YYYY-MM-DD)');
        return;
      }

      if (parsedStart > parsedEnd) {
        setErrorMessage('Start date cannot be after end date');
        return;
      }
    }

    setErrorMessage(null);
    onApply(trimmedStart || null, trimmedEnd || null);
    onClose();
  };

  const handleQuickPreset = (preset: 'last7' | 'last30' | 'thisMonth') => {
    const today = new Date();
    if (preset === 'last7') {
      setStart(toDateInputValue(subDays(today, 7)));
      setEnd(toDateInputValue(today));
    } else if (preset === 'last30') {
      setStart(toDateInputValue(subDays(today, 30)));
      setEnd(toDateInputValue(today));
    } else if (preset === 'thisMonth') {
      setStart(toDateInputValue(startOfMonth(today)));
      setEnd(toDateInputValue(endOfMonth(today)));
    }
    setErrorMessage(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center items-center bg-black/60 px-4"
      >
        <View className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              Custom Date Range
            </Text>
            <TouchableOpacity
              testID="close-date-range-modal"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close date range modal"
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <Text className="text-slate-500 dark:text-slate-400 font-bold text-base">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick preset chips */}
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Quick Select
          </Text>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              testID="quick-preset-last7"
              onPress={() => handleQuickPreset('last7')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">Last 7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="quick-preset-last30"
              onPress={() => handleQuickPreset('last30')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">Last 30 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="quick-preset-thisMonth"
              onPress={() => handleQuickPreset('thisMonth')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">This Month</Text>
            </TouchableOpacity>
          </View>

          {/* Date Inputs */}
          <View className="gap-y-4 mb-4">
            <View>
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date (YYYY-MM-DD)
              </Text>
              <TextInput
                testID="custom-start-date-input"
                value={start}
                onChangeText={setStart}
                placeholder="2026-08-01"
                placeholderTextColor="#94a3b8"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date (YYYY-MM-DD)
              </Text>
              <TextInput
                testID="custom-end-date-input"
                value={end}
                onChangeText={setEnd}
                placeholder="2026-08-31"
                placeholderTextColor="#94a3b8"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base"
              />
            </View>
          </View>

          {errorMessage && (
            <Text
              testID="date-range-error-message"
              className="text-xs text-rose-600 dark:text-rose-400 mb-3"
            >
              {errorMessage}
            </Text>
          )}

          {/* Action Buttons */}
          <View className="flex-row justify-end gap-3 mt-2">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
            >
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="apply-date-range-button"
              onPress={handleApply}
              className="px-5 py-2 rounded-lg bg-indigo-600"
            >
              <Text className="text-sm font-semibold text-white">Apply Range</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
