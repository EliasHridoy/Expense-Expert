import React from 'react';
import { View, Text } from 'react-native';
import { ThresholdState } from '../types/budget.types';
import { getThresholdColor } from '../utils/budget.util';

export interface BudgetProgressBarProps {
  percentage: number;
  thresholdState?: ThresholdState;
  showLabel?: boolean;
  heightClass?: string;
  className?: string;
  testID?: string;
}

/**
 * Accessible, color-coded progress bar for budget utilization.
 * Visually clamps the bar fill to [0%, 100%] while supporting arbitrary percentage displays.
 */
export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  percentage,
  thresholdState,
  showLabel = false,
  heightClass = 'h-2.5',
  className = '',
  testID = 'budget-progress-bar',
}) => {
  // Infer threshold state if not explicitly passed
  const resolvedState: ThresholdState =
    thresholdState ||
    (percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'under');

  const colorStyles = getThresholdColor(resolvedState);
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const getStatusLabel = () => {
    switch (resolvedState) {
      case 'exceeded':
        return 'Over Budget';
      case 'warning':
        return 'Near Limit';
      case 'under':
      default:
        return 'Under Budget';
    }
  };

  return (
    <View className={`w-full ${className}`} testID={testID}>
      {showLabel && (
        <View className="flex-row items-center justify-between mb-1.5">
          <Text
            testID={`${testID}-status`}
            className={`text-xs font-semibold ${colorStyles.textColor}`}
          >
            {getStatusLabel()}
          </Text>
          <Text
            testID={`${testID}-percentage`}
            className={`text-xs font-bold ${colorStyles.textColor}`}
          >
            {percentage.toFixed(1)}%
          </Text>
        </View>
      )}

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(clampedPercentage),
        }}
        accessibilityLabel={`Budget progress: ${percentage.toFixed(1)}% utilized, status is ${getStatusLabel()}`}
        className={`w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60 ${heightClass}`}
        testID={`${testID}-track`}
      >
        <View
          testID={`${testID}-fill`}
          style={{ width: `${clampedPercentage}%` }}
          className={`h-full rounded-full transition-all duration-300 ${colorStyles.barColor}`}
        />
      </View>
    </View>
  );
};
