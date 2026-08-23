import React, { useState } from 'react';
import { View, Text, useWindowDimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { format, parseISO } from 'date-fns';
import { MonthlyTrend } from '../types/dashboard.types';
import { normalizeBarScale } from '../utils/svg-chart.util';
import { formatCents } from '../../expenses/utils/currency.util';

export interface MonthlyTrendBarChartProps {
  trends?: MonthlyTrend[];
  data?: MonthlyTrend[];
  height?: number;
  testID?: string;
}

function formatMonthLabel(monthStr: string): string {
  try {
    const date = monthStr.length === 7 ? parseISO(`${monthStr}-01`) : parseISO(monthStr);
    if (!isNaN(date.getTime())) {
      return format(date, 'MMM');
    }
  } catch {
    // Fallback if parsing fails
  }
  return monthStr.includes('-') ? monthStr.split('-')[1] : monthStr;
}

export const MonthlyTrendBarChart: React.FC<MonthlyTrendBarChartProps> = ({
  trends,
  data,
  height = 220,
  testID = 'monthly-trend-bar-chart',
}) => {
  const chartData = trends ?? data ?? [];
  const { width: screenWidth } = useWindowDimensions();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const hasNonZeroData = chartData.some(
    (d) => (d.totalExpensesInCents || 0) > 0 || (d.totalSavingsInCents || 0) > 0
  );

  if (chartData.length === 0 || !hasNonZeroData) {
    return (
      <View
        testID="empty-trend-chart"
        className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 items-center justify-center border border-slate-100 dark:border-slate-700 min-h-[260px]"
      >
        <Text className="text-3xl mb-2">📈</Text>
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No historical trend data
        </Text>
        <Text className="text-xs text-slate-400 mt-1">
          Historical spending and savings will appear here
        </Text>
      </View>
    );
  }

  // Responsive chart width
  const effectiveScreenWidth = screenWidth || 360;
  const chartWidth = Math.min(Math.max(effectiveScreenWidth - 64, 300), 600);
  const paddingLeft = 52;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 30;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const allValues = chartData.flatMap((d) => [
    d.totalExpensesInCents || 0,
    d.totalSavingsInCents || 0,
  ]);

  const { maxVal, gridTicks } = normalizeBarScale(allValues, plotHeight);

  const groupWidth = plotWidth / chartData.length;
  const barWidth = Math.min(Math.max(groupWidth * 0.32, 8), 22);

  const selectedItem = selectedIdx !== null ? chartData[selectedIdx] : null;

  return (
    <View
      testID={testID}
      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
            Expenses vs Savings
          </Text>
          <Text className="text-xs text-slate-400">
            {chartData.length <= 6 ? `Last ${chartData.length} Months` : 'Historical Trends'}
          </Text>
        </View>

        {/* Legend */}
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm bg-rose-500" />
            <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Expenses
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm bg-indigo-500" />
            <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Savings
            </Text>
          </View>
        </View>
      </View>

      {/* Interactive Value Highlight Banner */}
      {selectedItem && (
        <View
          testID="trend-tooltip-badge"
          className="mb-3 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex-row justify-between items-center border border-slate-200/60 dark:border-slate-600"
        >
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {selectedItem.month}
          </Text>
          <View className="flex-row gap-4">
            <Text className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              Exp: {formatCents(selectedItem.totalExpensesInCents)}
            </Text>
            <Text className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              Sav: {formatCents(selectedItem.totalSavingsInCents)}
            </Text>
          </View>
        </View>
      )}

      {/* SVG Plot */}
      <View className="items-center">
        <Svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
          {/* Horizontal Grid lines */}
          {gridTicks.map((tickVal) => {
            const ratio = maxVal > 0 ? tickVal / maxVal : 0;
            const y = paddingTop + plotHeight * (1 - ratio);
            return (
              <G key={`grid-${tickVal}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <SvgText
                  x={paddingLeft - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                >
                  {formatCents(tickVal)}
                </SvgText>
              </G>
            );
          })}

          {/* Dual Bars per Month */}
          {chartData.map((item, idx) => {
            const groupX = paddingLeft + idx * groupWidth;
            const expHeight = maxVal > 0 ? ((item.totalExpensesInCents || 0) / maxVal) * plotHeight : 0;
            const savHeight = maxVal > 0 ? ((item.totalSavingsInCents || 0) / maxVal) * plotHeight : 0;

            const expX = groupX + (groupWidth - barWidth * 2 - 4) / 2;
            const savX = expX + barWidth + 4;
            const expY = paddingTop + (plotHeight - expHeight);
            const savY = paddingTop + (plotHeight - savHeight);

            const isSelected = selectedIdx === idx;
            const isDimmed = selectedIdx !== null && !isSelected;

            return (
              <G
                key={item.month}
                testID={`month-group-${item.month}`}
                onPress={() => setSelectedIdx(isSelected ? null : idx)}
              >
                {/* Expense Bar (Rose) */}
                <Rect
                  testID={`bar-expense-${item.month}`}
                  x={expX}
                  y={expY}
                  width={barWidth}
                  height={Math.max(expHeight, 2)}
                  rx={4}
                  ry={4}
                  fill="#f43f5e"
                  opacity={isDimmed ? 0.4 : 1}
                  onPress={() => setSelectedIdx(isSelected ? null : idx)}
                />

                {/* Savings Bar (Indigo) */}
                <Rect
                  testID={`bar-savings-${item.month}`}
                  x={savX}
                  y={savY}
                  width={barWidth}
                  height={Math.max(savHeight, 2)}
                  rx={4}
                  ry={4}
                  fill="#6366f1"
                  opacity={isDimmed ? 0.4 : 1}
                  onPress={() => setSelectedIdx(isSelected ? null : idx)}
                />

                {/* Month Label (X-Axis) */}
                <SvgText
                  testID={`label-month-${item.month}`}
                  x={groupX + groupWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  fill={isSelected ? '#6366f1' : '#64748b'}
                  onPress={() => setSelectedIdx(isSelected ? null : idx)}
                >
                  {formatMonthLabel(item.month)}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};
