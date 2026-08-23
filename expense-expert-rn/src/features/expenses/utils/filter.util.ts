import {
  isToday,
  isThisWeek,
  isThisMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
  isValid,
} from 'date-fns';
import { Expense } from '../types/expense.types';
import {
  FilterCriteria,
  DateRangePreset,
  SortOption,
  GroupOption,
  GroupedExpenses,
} from '../types/filter.types';
import { fromCents } from './currency.util';
import { parseDate, toDateInputValue, formatDisplayDate } from './date.util';

export type {
  FilterCriteria,
  DateRangePreset,
  SortOption,
  GroupOption,
  GroupedExpenses,
};

/**
 * Filters a list of expenses based on criteria (category, date range, search query)
 * and sorts the result.
 */
export function filterExpenses(expenses: Expense[], criteria: FilterCriteria): Expense[] {
  if (!expenses || expenses.length === 0) {
    return [];
  }

  let result = expenses;

  // 1. Category Filter
  if (criteria.category && criteria.category !== 'all') {
    result = result.filter((e) => e.category === criteria.category);
  }

  // 2. Date Range Filter
  if (criteria.dateRange && criteria.dateRange !== 'all') {
    result = result.filter((e) => {
      const expDate = parseDate(e.date);
      if (!isValid(expDate)) {
        return true;
      }

      switch (criteria.dateRange) {
        case 'today':
          return isToday(expDate);

        case 'week':
          return isThisWeek(expDate, { weekStartsOn: 1 }); // Monday start

        case 'month':
          return isThisMonth(expDate);

        case 'custom': {
          const hasStart = Boolean(criteria.customStartDate);
          const hasEnd = Boolean(criteria.customEndDate);

          if (hasStart && hasEnd) {
            const start = startOfDay(parseDate(criteria.customStartDate));
            const end = endOfDay(parseDate(criteria.customEndDate));
            if (!isValid(start) || !isValid(end)) return true;
            return isWithinInterval(expDate, { start, end });
          } else if (hasStart) {
            const start = startOfDay(parseDate(criteria.customStartDate));
            if (!isValid(start)) return true;
            return expDate >= start;
          } else if (hasEnd) {
            const end = endOfDay(parseDate(criteria.customEndDate));
            if (!isValid(end)) return true;
            return expDate <= end;
          }
          return true;
        }

        default:
          return true;
      }
    });
  }

  // 3. Text Search Filter (Case-insensitive matching title or description)
  if (criteria.searchQuery && criteria.searchQuery.trim().length > 0) {
    const query = criteria.searchQuery.trim().toLowerCase();
    result = result.filter((e) => {
      const titleMatch = (e.title || '').toLowerCase().includes(query);
      const descMatch = (e.description || '').toLowerCase().includes(query);
      return titleMatch || descMatch;
    });
  }

  // 4. Sorting
  return sortExpenses(result, criteria.sortBy);
}

/**
 * Sorts expenses according to specified SortOption.
 * Returns a new sorted array.
 */
export function sortExpenses(expenses: Expense[], sortBy: SortOption): Expense[] {
  const sorted = [...expenses];

  switch (sortBy) {
    case 'date_desc':
      return sorted.sort((a, b) => {
        const timeA = parseDate(a.date).getTime();
        const timeB = parseDate(b.date).getTime();
        return timeB - timeA;
      });

    case 'date_asc':
      return sorted.sort((a, b) => {
        const timeA = parseDate(a.date).getTime();
        const timeB = parseDate(b.date).getTime();
        return timeA - timeB;
      });

    case 'amount_desc':
      return sorted.sort((a, b) => {
        const amtA = a.amountInCents ?? 0;
        const amtB = b.amountInCents ?? 0;
        return amtB - amtA;
      });

    case 'amount_asc':
      return sorted.sort((a, b) => {
        const amtA = a.amountInCents ?? 0;
        const amtB = b.amountInCents ?? 0;
        return amtA - amtB;
      });

    case 'title_asc':
      return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    default:
      return sorted;
  }
}

/**
 * Groups expenses by category or date, or returns an all-inclusive single group when none.
 */
export function groupExpenses(
  expenses: Expense[],
  groupBy: GroupOption,
  getCategoryLabel?: (cat: string) => string
): GroupedExpenses[] {
  if (!expenses || expenses.length === 0) {
    return [];
  }

  if (groupBy === 'category') {
    const map = new Map<string, Expense[]>();

    for (const exp of expenses) {
      const cat = exp.category || 'other';
      const list = map.get(cat) || [];
      list.push(exp);
      map.set(cat, list);
    }

    const groups: GroupedExpenses[] = [];
    for (const [cat, items] of map.entries()) {
      const totalInCents = items.reduce((sum, item) => sum + (item.amountInCents ?? 0), 0);
      const title = getCategoryLabel ? getCategoryLabel(cat) : cat;
      groups.push({
        key: cat,
        title,
        totalInCents,
        total: fromCents(totalInCents),
        items,
      });
    }

    // Sort category groups by total amount descending
    return groups.sort((a, b) => b.totalInCents - a.totalInCents);
  }

  if (groupBy === 'date') {
    const map = new Map<string, Expense[]>();

    for (const exp of expenses) {
      const dateKey = toDateInputValue(exp.date);
      const list = map.get(dateKey) || [];
      list.push(exp);
      map.set(dateKey, list);
    }

    // Sort date keys descending (newest date first)
    const sortedDateKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDateKeys.map((dateKey) => {
      const items = map.get(dateKey) || [];
      const totalInCents = items.reduce((sum, item) => sum + (item.amountInCents ?? 0), 0);
      return {
        key: dateKey,
        title: formatDisplayDate(dateKey),
        totalInCents,
        total: fromCents(totalInCents),
        items,
      };
    });
  }

  // groupBy === 'none'
  const totalInCents = expenses.reduce((sum, item) => sum + (item.amountInCents ?? 0), 0);
  return [
    {
      key: 'all',
      title: 'All Transactions',
      totalInCents,
      total: fromCents(totalInCents),
      items: expenses,
    },
  ];
}
