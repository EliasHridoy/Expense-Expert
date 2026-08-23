import { useState, useMemo, useCallback } from 'react';
import { Expense } from '../types/expense.types';
import {
  FilterCriteria,
  DateRangePreset,
  SortOption,
  GroupOption,
  GroupedExpenses,
  ViewMode,
  DEFAULT_FILTER_CRITERIA,
} from '../types/filter.types';
import { filterExpenses, groupExpenses } from '../utils/filter.util';
import { fromCents } from '../utils/currency.util';

export interface UseTransactionFiltersResult {
  criteria: FilterCriteria;
  viewMode: ViewMode;
  filteredExpenses: Expense[];
  groupedExpenses: GroupedExpenses[];
  totalFilteredCents: number;
  totalFiltered: number;
  filteredCount: number;
  setCategory: (category: string) => void;
  setDateRange: (dateRange: DateRangePreset) => void;
  setCustomDateRange: (startDate: string | null, endDate: string | null) => void;
  setSearchQuery: (searchQuery: string) => void;
  setSortBy: (sortBy: SortOption) => void;
  setGroupBy: (groupBy: GroupOption) => void;
  setViewMode: (viewMode: ViewMode) => void;
  toggleViewMode: () => void;
  setCriteria: (criteria: Partial<FilterCriteria> | ((prev: FilterCriteria) => FilterCriteria)) => void;
  resetFilters: () => void;
}

export interface UseTransactionFiltersOptions {
  initialCriteria?: Partial<FilterCriteria>;
  initialViewMode?: ViewMode;
  getCategoryLabel?: (category: string) => string;
}

/**
 * Hook for managing multi-criteria expense filtering, search, sorting, and grouping.
 * All operations are memoized for sub-millisecond in-memory performance.
 */
export function useTransactionFilters(
  expenses: Expense[] = [],
  optionsOrCriteria?: Partial<FilterCriteria> | UseTransactionFiltersOptions,
  categoryLabelGetter?: (category: string) => string
): UseTransactionFiltersResult {
  // Normalize options parameter
  const options: UseTransactionFiltersOptions = useMemo(() => {
    if (!optionsOrCriteria) {
      return { getCategoryLabel: categoryLabelGetter };
    }
    if ('category' in optionsOrCriteria || 'dateRange' in optionsOrCriteria || 'searchQuery' in optionsOrCriteria) {
      return {
        initialCriteria: optionsOrCriteria as Partial<FilterCriteria>,
        getCategoryLabel: categoryLabelGetter,
      };
    }
    return {
      ...(optionsOrCriteria as UseTransactionFiltersOptions),
      getCategoryLabel: (optionsOrCriteria as UseTransactionFiltersOptions).getCategoryLabel || categoryLabelGetter,
    };
  }, [optionsOrCriteria, categoryLabelGetter]);

  const [criteria, setCriteriaState] = useState<FilterCriteria>(() => ({
    ...DEFAULT_FILTER_CRITERIA,
    ...(options.initialCriteria || {}),
  }));

  const [viewMode, setViewMode] = useState<ViewMode>(options.initialViewMode || 'list');

  // Filtered & Sorted list
  const filteredExpenses = useMemo(() => {
    return filterExpenses(expenses, criteria);
  }, [expenses, criteria]);

  // Aggregate totals in safe integer cents
  const totalFilteredCents = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (item.amountInCents ?? 0), 0);
  }, [filteredExpenses]);

  const totalFiltered = useMemo(() => fromCents(totalFilteredCents), [totalFilteredCents]);

  // Grouped results
  const groupedExpenses = useMemo(() => {
    return groupExpenses(filteredExpenses, criteria.groupBy, options.getCategoryLabel);
  }, [filteredExpenses, criteria.groupBy, options.getCategoryLabel]);

  // Action Setters
  const setCategory = useCallback((category: string) => {
    setCriteriaState((prev) => ({ ...prev, category }));
  }, []);

  const setDateRange = useCallback((dateRange: DateRangePreset) => {
    setCriteriaState((prev) => ({ ...prev, dateRange }));
  }, []);

  const setCustomDateRange = useCallback((startDate: string | null, endDate: string | null) => {
    setCriteriaState((prev) => ({
      ...prev,
      dateRange: 'custom',
      customStartDate: startDate,
      customEndDate: endDate,
    }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setCriteriaState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    setCriteriaState((prev) => ({ ...prev, sortBy }));
  }, []);

  const setGroupBy = useCallback((groupBy: GroupOption) => {
    setCriteriaState((prev) => ({ ...prev, groupBy }));
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
  }, []);

  const setCriteria = useCallback(
    (updater: Partial<FilterCriteria> | ((prev: FilterCriteria) => FilterCriteria)) => {
      setCriteriaState((prev) => {
        if (typeof updater === 'function') {
          return updater(prev);
        }
        return { ...prev, ...updater };
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    setCriteriaState({
      ...DEFAULT_FILTER_CRITERIA,
      ...(options.initialCriteria || {}),
    });
  }, [options.initialCriteria]);

  return {
    criteria,
    viewMode,
    filteredExpenses,
    groupedExpenses,
    totalFilteredCents,
    totalFiltered,
    filteredCount: filteredExpenses.length,
    setCategory,
    setDateRange,
    setCustomDateRange,
    setSearchQuery,
    setSortBy,
    setGroupBy,
    setViewMode,
    toggleViewMode,
    setCriteria,
    resetFilters,
  };
}
