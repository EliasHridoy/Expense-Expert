import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { DateRangePreset } from '../types/filter.types';
import { DateRangeModal } from './DateRangeModal';

export interface DateRangePickerProps {
  selectedPreset: DateRangePreset;
  onSelectPreset: (preset: DateRangePreset) => void;
  startDate?: string | null;
  endDate?: string | null;
  onCustomDateChange?: (start: string | null, end: string | null) => void;
  testID?: string;
}

const PRESETS: { value: DateRangePreset; label: string; icon: string }[] = [
  { value: 'all', label: 'All Time', icon: '🌐' },
  { value: 'today', label: 'Today', icon: '📅' },
  { value: 'week', label: 'This Week', icon: '🗓️' },
  { value: 'month', label: 'This Month', icon: '📆' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedPreset,
  onSelectPreset,
  startDate = null,
  endDate = null,
  onCustomDateChange,
  testID = 'date-range-picker',
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handlePresetPress = (preset: DateRangePreset) => {
    onSelectPreset(preset);
    if (preset === 'custom') {
      setModalVisible(true);
    }
  };

  const handleCustomApply = (start: string | null, end: string | null) => {
    if (onCustomDateChange) {
      onCustomDateChange(start, end);
    }
  };

  const formatCustomLabel = () => {
    if (!startDate && !endDate) return 'Custom Range';
    if (startDate && endDate) return `${startDate} → ${endDate}`;
    if (startDate) return `From ${startDate}`;
    return `Until ${endDate}`;
  };

  return (
    <View testID={testID} className="py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="flex-row"
      >
        {PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.value;
          const displayLabel =
            preset.value === 'custom' && isSelected && (startDate || endDate)
              ? formatCustomLabel()
              : preset.label;

          return (
            <TouchableOpacity
              key={preset.value}
              testID={`date-preset-${preset.value}`}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${preset.label}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handlePresetPress(preset.value)}
              className={`flex-row items-center px-3.5 py-1.5 rounded-full mr-2 border ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text className="text-sm mr-1.5">{preset.icon}</Text>
              <Text
                className={`text-sm font-medium ${
                  isSelected
                    ? 'text-white font-semibold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {displayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Custom Date Range Modal */}
      <DateRangeModal
        visible={modalVisible}
        startDate={startDate}
        endDate={endDate}
        onApply={handleCustomApply}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};
