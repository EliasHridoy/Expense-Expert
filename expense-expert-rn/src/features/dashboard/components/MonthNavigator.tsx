import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { addMonths, format, isValid, parse, subMonths } from 'date-fns';
import { colors } from '../../../theme';

export interface MonthNavigatorProps {
  activeMonth: string; // Format: "YYYY-MM"
  onChangeMonth: (month: string) => void;
  minMonth?: string; // Format: "YYYY-MM"
  maxMonth?: string; // Format: "YYYY-MM"
  className?: string;
  testID?: string;
}

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
      style={styles.container}
      className={`bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700/60 shadow-xs flex-row items-center justify-between ${className}`}
    >
      {/* Previous Month Button */}
      <TouchableOpacity
        testID="month-prev-btn"
        onPress={handlePrev}
        disabled={isPrevDisabled}
        accessibilityRole="button"
        accessibilityLabel="Previous Month"
        style={[styles.arrowBtn, isPrevDisabled && styles.arrowBtnDisabled]}
      >
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>

      {/* Middle: Month & Year display + optional Current Month reset badge */}
      <View style={styles.middleSection} className="flex-row items-center gap-x-2.5">
        <Text
          testID="month-title-text"
          style={styles.titleText}
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
            style={styles.resetBtn}
            className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 active:bg-indigo-100"
          >
            <Text style={styles.resetBtnText} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
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
        style={[styles.arrowBtn, isNextDisabled && styles.arrowBtnDisabled]}
      >
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }),
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  arrowBtnDisabled: {
    opacity: 0.3,
    backgroundColor: '#f1f5f9',
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#334155',
  },
  middleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
