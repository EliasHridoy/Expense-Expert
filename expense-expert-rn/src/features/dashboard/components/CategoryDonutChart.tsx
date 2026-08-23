import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { generateDonutSlices, CATEGORY_PALETTE } from '../utils/svg-chart.util';
import { CategoryBreakdown } from '../types/dashboard.types';
import { formatCents } from '../../expenses/utils/currency.util';

export interface CategoryDonutChartProps {
  data: CategoryBreakdown[];
  size?: number;
  onSelectCategory?: (category: string) => void;
  testID?: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  data,
  size = 220,
  onSelectCategory,
  testID = 'category-donut-chart',
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalCents = data.reduce((sum, d) => sum + Math.max(0, d.totalInCents), 0);
  const totalTransactions = data.reduce((sum, d) => sum + (d.count || 0), 0);

  if (data.length === 0 || totalCents === 0) {
    return (
      <View
        testID="empty-donut-chart"
        className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 items-center justify-center border border-slate-100 dark:border-slate-700 min-h-[260px]"
      >
        <Text className="text-3xl mb-2">📊</Text>
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No category spending recorded
        </Text>
        <Text className="text-xs text-slate-400 mt-1">
          Expenses logged for this month will appear here
        </Text>
      </View>
    );
  }

  const chartItems = data
    .filter((d) => d.totalInCents > 0)
    .map((d, index) => ({
      id: d.category,
      label: d.category,
      valueInCents: d.totalInCents,
      color: d.color ?? CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
    }));

  const slices = generateDonutSlices(chartItems, size, 32);
  const activeSlice = slices.find((s) => s.id === selectedId);

  const handleSelect = (categoryId: string) => {
    const nextSelected = selectedId === categoryId ? null : categoryId;
    setSelectedId(nextSelected);
    if (nextSelected && onSelectCategory) {
      onSelectCategory(nextSelected);
    }
  };

  const centerTitle = (activeSlice ? activeSlice.label : 'Total Spent').toUpperCase();

  return (
    <View
      testID={testID}
      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
            Spending by Category
          </Text>
          <Text className="text-xs text-slate-400">
            {totalTransactions} {totalTransactions === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>
      </View>

      <View className="items-center justify-center relative py-2">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>
            {slices.map((slice) => {
              const isSelected = selectedId === slice.id;
              return (
                <Path
                  key={slice.id}
                  testID={`donut-slice-${slice.id}`}
                  d={slice.pathData}
                  fill={slice.color}
                  opacity={selectedId && !isSelected ? 0.4 : 1}
                  stroke={isSelected ? '#ffffff' : 'none'}
                  strokeWidth={isSelected ? 3 : 0}
                  onPress={() => handleSelect(slice.id)}
                />
              );
            })}
          </G>
        </Svg>

        {/* Center Donut Label */}
        <View
          style={{ pointerEvents: 'none' as any }}
          className="absolute items-center justify-center w-28 text-center"
        >
          <Text
            numberOfLines={1}
            className="text-[10px] font-bold text-slate-400 tracking-wider text-center"
          >
            {centerTitle}
          </Text>
          <Text
            numberOfLines={1}
            className="text-base font-extrabold text-slate-900 dark:text-slate-100 text-center"
          >
            {formatCents(activeSlice ? activeSlice.valueInCents : totalCents)}
          </Text>
          {activeSlice && (
            <Text className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 text-center">
              {`${activeSlice.percentage}%`}
            </Text>
          )}
        </View>
      </View>

      {/* Category Legend List */}
      <View className="flex-row flex-wrap justify-center gap-2 mt-4">
        {slices.map((slice) => {
          const isSelected = selectedId === slice.id;
          return (
            <TouchableOpacity
              key={slice.id}
              testID={`legend-item-${slice.id}`}
              onPress={() => handleSelect(slice.id)}
              activeOpacity={0.8}
              className={`flex-row items-center px-2.5 py-1.5 rounded-lg border ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <View
                style={{ backgroundColor: slice.color }}
                className="w-2.5 h-2.5 rounded-full mr-1.5"
              />
              <Text className="text-xs font-medium text-slate-700 dark:text-slate-300 mr-1.5">
                {slice.label}
              </Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {`${slice.percentage}%`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
