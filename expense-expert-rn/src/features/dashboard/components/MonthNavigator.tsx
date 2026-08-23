import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { addMonths, format, isValid, parse, subMonths } from 'date-fns';

export interface MonthNavigatorProps {
  activeMonth: string; // Format: "YYYY-MM"
  onChangeMonth: (month: string) => void;
  minMonth?: string; // Format: "YYYY-MM"
  maxMonth?: string; // Format: "YYYY-MM"
  className?: string;
  testID?: string;
}

/**
 * MonthNavigator component for bi-directional temporal navigation.
 * Allows step-wise browsing between months with boundary safeguards
 * and a quick-jump button back to the current active month.
 */
export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  activeMonth,
  onChangeMonth,
  minMonth,
  maxMonth,
  className = '',
  testID = 'month-navigator',
}) => {
  const currentDate = useMemo(() => {
    try {
      const parsed = parse(`${activeMonth}-01`, 'yyyy-MM-dd', new Date());
      return isValid(parsed) ? parsed : new Date();
    } catch {
      return new Date();
    }
  }, [activeMonth]);

  const currentMonthStr = useMemo(() => {
    return format(new Date(), 'yyyy-MM');
  }, []);

  const isCurrentMonth = activeMonth === currentMonthStr;

  const displayTitle = useMemo(() => {
    return format(currentDate, 'MMMM yyyy');
  }, [currentDate]);

  const isPrevDisabled = useMemo(() => {
    if (!minMonth) return false;
    const prevMonthStr = format(subMonths(currentDate, 1), 'yyyy-MM');
    return prevMonthStr < minMonth;
  }, [currentDate, minMonth]);

  const isNextDisabled = useMemo(() => {
    if (!maxMonth) return false;
    const nextMonthStr = format(addMonths(currentDate, 1), 'yyyy-MM');
    return nextMonthStr > maxMonth;
  }, [currentDate, maxMonth]);

  const handlePrev = () => {
    if (isPrevDisabled) return;
    const prev = subMonths(currentDate, 1);
    onChangeMonth(format(prev, 'yyyy-MM'));
  };

  const handleNext = () => {
    if (isNextDisabled) return;
    const next = addMonths(currentDate, 1);
    onChangeMonth(format(next, 'yyyy-MM'));
  };

  const handleResetCurrentMonth = () => {
    onChangeMonth(currentMonthStr);
  };

  return (
    <View
      testID={testID}
      className={`bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700/60 shadow-xs flex-row items-center justify-between ${className}`}
    >
      {/* Previous Month Button */}
      <TouchableOpacity
        testID="month-prev-btn"
        onPress={handlePrev}
        disabled={isPrevDisabled}
        accessibilityRole="button"
        accessibilityLabel="Previous Month"
        className={`w-9 h-9 rounded-xl items-center justify-center border border-slate-200 dark:border-slate-700 ${
          isPrevDisabled
            ? 'opacity-30 bg-slate-50 dark:bg-slate-800'
            : 'bg-slate-50 dark:bg-slate-900 active:bg-slate-100 dark:active:bg-slate-700'
        }`}
      >
        <Text className="text-base font-bold text-slate-700 dark:text-slate-300">
          ‹
        </Text>
      </TouchableOpacity>

      {/* Middle: Month & Year display + optional Current Month reset badge */}
      <View className="flex-row items-center space-x-2.5">
        <Text
          testID="month-title-text"
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
        >
          {displayTitle}
        </Text>

        {!isCurrentMonth && (
          <TouchableOpacity
            testID="month-current-reset-btn"
            onPress={handleResetCurrentMonth}
            accessibilityRole="button"
            accessibilityLabel="Jump to Current Month"
            className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 active:bg-indigo-100 ml-1.5"
          >
            <Text className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              Current Month
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Next Month Button */}
      <TouchableOpacity
        testID="month-next-btn"
        onPress={handleNext}
        disabled={isNextDisabled}
        accessibilityRole="button"
        accessibilityLabel="Next Month"
        className={`w-9 h-9 rounded-xl items-center justify-center border border-slate-200 dark:border-slate-700 ${
          isNextDisabled
            ? 'opacity-30 bg-slate-50 dark:bg-slate-800'
            : 'bg-slate-50 dark:bg-slate-900 active:bg-slate-100 dark:active:bg-slate-700'
        }`}
      >
        <Text className="text-base font-bold text-slate-700 dark:text-slate-300">
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
};
