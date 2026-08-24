import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
        style={styles.emptyCard}
        className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 items-center justify-center border border-slate-100 dark:border-slate-700 min-h-[260px]"
      >
        <Text style={styles.emptyIcon} className="text-3xl mb-2">📊</Text>
        <Text style={styles.emptyTitle} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No category spending recorded
        </Text>
        <Text style={styles.emptySubtitle} className="text-xs text-slate-400 mt-1">
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
      style={styles.card}
      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <View style={styles.headerRow} className="flex-row justify-between items-center mb-4">
        <View>
          <Text style={styles.title} className="text-base font-bold text-slate-900 dark:text-slate-100">
            Spending by Category
          </Text>
          <Text style={styles.subtitle} className="text-xs text-slate-400">
            {totalTransactions} {totalTransactions === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrapper} className="items-center justify-center relative py-2">
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
          style={[styles.centerLabelBox, { pointerEvents: 'none' as any }]}
          className="absolute items-center justify-center w-28 text-center"
        >
          <Text
            numberOfLines={1}
            style={styles.centerLabelTitle}
            className="text-[10px] font-bold text-slate-400 tracking-wider text-center"
          >
            {centerTitle}
          </Text>
          <Text
            numberOfLines={1}
            style={styles.centerLabelAmount}
            className="text-base font-extrabold text-slate-900 dark:text-slate-100 text-center"
          >
            {formatCents(activeSlice ? activeSlice.valueInCents : totalCents)}
          </Text>
          {activeSlice && (
            <Text style={styles.centerLabelPercent} className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 text-center">
              {`${activeSlice.percentage}%`}
            </Text>
          )}
        </View>
      </View>

      {/* Category Legend List */}
      <View style={styles.legendContainer} className="flex-row flex-wrap justify-center gap-2 mt-4">
        {slices.map((slice) => {
          const isSelected = selectedId === slice.id;
          return (
            <TouchableOpacity
              key={slice.id}
              testID={`legend-item-${slice.id}`}
              onPress={() => handleSelect(slice.id)}
              activeOpacity={0.8}
              style={[
                styles.legendChip,
                isSelected ? styles.legendChipSelected : styles.legendChipUnselected,
              ]}
              className={`flex-row items-center px-2.5 py-1.5 rounded-lg border ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <View
                style={[styles.dot, { backgroundColor: slice.color }]}
                className="w-2.5 h-2.5 rounded-full mr-1.5"
              />
              <Text style={styles.chipLabel} className="text-xs font-medium text-slate-700 dark:text-slate-300 mr-1.5">
                {slice.label}
              </Text>
              <Text style={styles.chipPercent} className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {`${slice.percentage}%`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  centerLabelBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  centerLabelTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  centerLabelAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 2,
  },
  centerLabelPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  legendChipSelected: {
    backgroundColor: '#f1f5f9',
    borderColor: '#94a3b8',
  },
  legendChipUnselected: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginRight: 6,
  },
  chipPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 240,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});
