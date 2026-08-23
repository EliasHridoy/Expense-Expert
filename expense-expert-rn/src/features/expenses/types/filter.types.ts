import { Expense } from './expense.types';

export type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'custom';

export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'title_asc';

export type GroupOption = 'none' | 'category' | 'date';

export type ViewMode = 'list' | 'grid';

export interface FilterCriteria {
  category: string; // 'all' or category value/id
  dateRange: DateRangePreset;
  customStartDate?: string | null; // ISO string or YYYY-MM-DD
  customEndDate?: string | null;   // ISO string or YYYY-MM-DD
  searchQuery: string;
  sortBy: SortOption;
  groupBy: GroupOption;
}

export interface GroupedExpenses {
  key: string;
  title: string;
  totalInCents: number;
  total: number;
  items: Expense[];
}

export const DEFAULT_FILTER_CRITERIA: FilterCriteria = {
  category: 'all',
  dateRange: 'all',
  customStartDate: null,
  customEndDate: null,
  searchQuery: '',
  sortBy: 'date_desc',
  groupBy: 'none',
};
