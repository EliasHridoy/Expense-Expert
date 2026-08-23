import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import {
  FilterCriteria,
  DateRangePreset,
  SortOption,
  GroupOption,
  ViewMode,
} from '../types/filter.types';
import { ExpenseSearchBar } from './ExpenseSearchBar';
import { FilterChips } from './FilterChips';
import { DateRangePicker } from './DateRangePicker';
import { formatCents } from '../utils/currency.util';

export interface ExpenseListHeaderProps {
  criteria: FilterCriteria;
  viewMode: ViewMode;
  totalFilteredCents: number;
  filteredCount: number;
  onSelectCategory: (cat: string) => void;
  onSelectPreset: (preset: DateRangePreset) => void;
  onCustomDateChange?: (start: string | null, end: string | null) => void;
  onSearchChange: (text: string) => void;
  onSelectSortBy: (sort: SortOption) => void;
  onSelectGroupBy: (group: GroupOption) => void;
  onToggleViewMode: () => void;
  onResetFilters?: () => void;
  testID?: string;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'date_desc', label: 'Date: Newest First', icon: '📅 ↓' },
  { value: 'date_asc', label: 'Date: Oldest First', icon: '📅 ↑' },
  { value: 'amount_desc', label: 'Amount: High to Low', icon: '💰 ↓' },
  { value: 'amount_asc', label: 'Amount: Low to High', icon: '💰 ↑' },
  { value: 'title_asc', label: 'Title: A to Z', icon: '🔤 A-Z' },
];

const GROUP_OPTIONS: { value: GroupOption; label: string; icon: string }[] = [
  { value: 'none', label: 'No Grouping', icon: '📑' },
  { value: 'category', label: 'Group by Category', icon: '🏷️' },
  { value: 'date', label: 'Group by Date', icon: '📅' },
];

export const ExpenseListHeader: React.FC<ExpenseListHeaderProps> = ({
  criteria,
  viewMode,
  totalFilteredCents,
  filteredCount,
  onSelectCategory,
  onSelectPreset,
  onCustomDateChange,
  onSearchChange,
  onSelectSortBy,
  onSelectGroupBy,
  onToggleViewMode,
  onResetFilters,
  testID = 'expense-list-header',
}) => {
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  const hasActiveFilters =
    criteria.category !== 'all' ||
    criteria.dateRange !== 'all' ||
    Boolean(criteria.searchQuery.trim());

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.value === criteria.sortBy)?.label || 'Sort';
  const currentGroupLabel =
    GROUP_OPTIONS.find((g) => g.value === criteria.groupBy)?.label || 'Group';

  return (
    <View testID={testID} className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-2">
      {/* 1. Search Bar */}
      <View className="px-4 pt-3 pb-1">
        <ExpenseSearchBar
          value={criteria.searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search expenses by title or note..."
        />
      </View>

      {/* 2. Date Range Picker Presets */}
      <DateRangePicker
        selectedPreset={criteria.dateRange}
        onSelectPreset={onSelectPreset}
        startDate={criteria.customStartDate}
        endDate={criteria.customEndDate}
        onCustomDateChange={onCustomDateChange}
      />

      {/* 3. Category Filter Chips */}
      <FilterChips
        selectedCategory={criteria.category}
        onSelectCategory={onSelectCategory}
      />

      {/* 4. Controls Toolbar (Sort, Group, ViewMode, Summary) */}
      <View className="flex-row items-center justify-between px-4 pt-2">
        <View className="flex-row items-center gap-2">
          {/* Sort Button */}
          <TouchableOpacity
            testID="sort-button"
            onPress={() => setSortModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sort options. Currently ${currentSortLabel}`}
            className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <Text className="text-xs mr-1 text-slate-500">⇅</Text>
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {currentSortLabel.split(':')[0]}
            </Text>
          </TouchableOpacity>

          {/* Group Button */}
          <TouchableOpacity
            testID="group-button"
            onPress={() => setGroupModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Group options. Currently ${currentGroupLabel}`}
            className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <Text className="text-xs mr-1 text-slate-500">☷</Text>
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {criteria.groupBy === 'none' ? 'Group' : criteria.groupBy}
            </Text>
          </TouchableOpacity>

          {/* Reset Filters button if any filter active */}
          {hasActiveFilters && onResetFilters && (
            <TouchableOpacity
              testID="reset-filters-button"
              onPress={onResetFilters}
              accessibilityRole="button"
              accessibilityLabel="Reset all filters"
              className="flex-row items-center bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800"
            >
              <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Reset
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* View Mode Toggle & Total Summary */}
        <View className="flex-row items-center gap-2">
          <View className="items-end">
            <Text
              testID="filtered-count-badge"
              className="text-xs text-slate-500 dark:text-slate-400 font-medium"
            >
              {filteredCount} {filteredCount === 1 ? 'item' : 'items'}
            </Text>
            <Text
              testID="filtered-total-badge"
              className="text-xs font-bold text-slate-900 dark:text-white"
            >
              {formatCents(totalFilteredCents)}
            </Text>
          </View>

          <TouchableOpacity
            testID="toggle-view-mode-button"
            onPress={onToggleViewMode}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ml-1"
          >
            <Text className="text-sm">{viewMode === 'list' ? '⊞' : '☰'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Options Modal */}
      <Modal
        visible={sortModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalOpen(false)}
        testID="sort-modal"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSortModalOpen(false)}
          className="flex-1 justify-center items-center bg-black/60 px-4"
        >
          <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Sort Transactions
            </Text>
            {SORT_OPTIONS.map((option) => {
              const isSelected = criteria.sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  testID={`sort-option-${option.value}`}
                  onPress={() => {
                    onSelectSortBy(option.value);
                    setSortModalOpen(false);
                  }}
                  className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800/60'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-base mr-3">{option.icon}</Text>
                    <Text
                      className={`text-sm font-medium ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {isSelected && <Text className="text-indigo-600 dark:text-indigo-400 font-bold">✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Group Options Modal */}
      <Modal
        visible={groupModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGroupModalOpen(false)}
        testID="group-modal"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setGroupModalOpen(false)}
          className="flex-1 justify-center items-center bg-black/60 px-4"
        >
          <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Group Transactions
            </Text>
            {GROUP_OPTIONS.map((option) => {
              const isSelected = criteria.groupBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  testID={`group-option-${option.value}`}
                  onPress={() => {
                    onSelectGroupBy(option.value);
                    setGroupModalOpen(false);
                  }}
                  className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800/60'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-base mr-3">{option.icon}</Text>
                    <Text
                      className={`text-sm font-medium ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {isSelected && <Text className="text-indigo-600 dark:text-indigo-400 font-bold">✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
