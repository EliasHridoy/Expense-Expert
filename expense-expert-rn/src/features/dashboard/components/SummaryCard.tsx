import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export type SummaryCardType = 'income' | 'expense' | 'savings' | 'neutral';

export interface SummaryCardProps {
  title: string;
  amountFormatted: string;
  icon?: string;
  type?: SummaryCardType;
  isNegative?: boolean;
  subtext?: string;
  badgeText?: string;
  badgeColor?: string;
  onPress?: () => void;
  className?: string;
  testID?: string;
}

/**
 * Reusable financial summary metric card with semantic color coding,
 * icon badge, touch support, and dark-mode compliance.
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amountFormatted,
  icon,
  type = 'neutral',
  isNegative = false,
  subtext,
  badgeText,
  badgeColor,
  onPress,
  className = '',
  testID = 'summary-card',
}) => {
  const getIconContainerStyle = () => {
    switch (type) {
      case 'income':
        return 'bg-emerald-50 dark:bg-emerald-950/50';
      case 'expense':
        return 'bg-rose-50 dark:bg-rose-950/50';
      case 'savings':
        return 'bg-indigo-50 dark:bg-indigo-950/50';
      case 'neutral':
      default:
        return 'bg-slate-100 dark:bg-slate-700/60';
    }
  };

  const getAmountColorStyle = () => {
    if (isNegative) {
      return 'text-rose-600 dark:text-rose-400';
    }
    switch (type) {
      case 'income':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'expense':
        return 'text-rose-600 dark:text-rose-400';
      case 'savings':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'neutral':
      default:
        return 'text-slate-900 dark:text-white';
    }
  };

  const CardContent = (
    <View
      className={`bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-xs ${className}`}
    >
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center flex-1 mr-2">
          {icon ? (
            <View
              testID={`${testID}-icon`}
              className={`w-9 h-9 rounded-xl items-center justify-center mr-2.5 ${getIconContainerStyle()}`}
            >
              <Text className="text-base">{icon}</Text>
            </View>
          ) : null}
          <Text
            testID={`${testID}-title`}
            className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex-shrink"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {badgeText ? (
          <View
            testID={`${testID}-badge`}
            className={`px-2 py-0.5 rounded-full ${badgeColor || 'bg-slate-100 dark:bg-slate-700'}`}
          >
            <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        testID={`${testID}-amount`}
        className={`text-xl sm:text-2xl font-black ${getAmountColorStyle()}`}
      >
        {amountFormatted}
      </Text>

      {subtext ? (
        <Text
          testID={`${testID}-subtext`}
          className="text-xs text-slate-400 dark:text-slate-500 mt-1"
        >
          {subtext}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessible={true}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} accessible={true}>
      {CardContent}
    </View>
  );
};
