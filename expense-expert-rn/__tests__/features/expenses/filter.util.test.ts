import {
  filterExpenses,
  sortExpenses,
  groupExpenses,
} from '../../../src/features/expenses/utils/filter.util';
import { toDateInputValue } from '../../../src/features/expenses/utils/date.util';
import { Expense } from '../../../src/features/expenses/types/expense.types';
import { FilterCriteria, DEFAULT_FILTER_CRITERIA } from '../../../src/features/expenses/types/filter.types';

describe('filter.util', () => {
  const now = new Date();
  const todayISO = now.toISOString();

  // Create dates relative to today
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15);

  const mockExpenses: Expense[] = [
    {
      id: '1',
      title: 'Groceries at Walmart',
      description: 'Weekly grocery run with snacks',
      amount: 45.5,
      amountInCents: 4550,
      category: 'food',
      date: todayISO,
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: todayISO,
      updatedAt: todayISO,
    },
    {
      id: '2',
      title: 'Uber Ride',
      description: 'Trip to downtown office',
      amount: 12.0,
      amountInCents: 1200,
      category: 'transport',
      date: yesterday.toISOString(),
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: '3',
      title: 'Movie Tickets',
      description: 'Cinema with friends',
      amount: 30.0,
      amountInCents: 3000,
      category: 'entertainment',
      date: twoWeeksAgo.toISOString(),
      month: '2026-08',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: twoWeeksAgo.toISOString(),
    },
    {
      id: '4',
      title: 'Electric Bill',
      description: 'Power company monthly bill',
      amount: 120.0,
      amountInCents: 12000,
      category: 'utilities',
      date: twoMonthsAgo.toISOString(),
      month: '2026-06',
      isLoan: false,
      loanPersonId: null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: null,
      draftId: null,
      installmentIndex: null,
      createdAt: twoMonthsAgo.toISOString(),
      updatedAt: twoMonthsAgo.toISOString(),
    },
  ];

  describe('filterExpenses', () => {
    it('returns empty array when given empty list', () => {
      const result = filterExpenses([], DEFAULT_FILTER_CRITERIA);
      expect(result).toEqual([]);
    });

    it('returns all expenses with default criteria', () => {
      const result = filterExpenses(mockExpenses, DEFAULT_FILTER_CRITERIA);
      expect(result.length).toBe(4);
    });

    describe('Category Filtering', () => {
      it('filters expenses by specific category', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          category: 'food',
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('1');
        expect(result[0].category).toBe('food');
      });

      it('returns all expenses when category is "all"', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          category: 'all',
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.length).toBe(4);
      });

      it('filters by custom category id', () => {
        const customExp: Expense = {
          ...mockExpenses[0],
          id: 'custom-1',
          category: 'custom_gym_123',
        };
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          category: 'custom_gym_123',
        };
        const result = filterExpenses([...mockExpenses, customExp], criteria);
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('custom-1');
      });
    });

    describe('Date Range Filtering', () => {
      it('filters expenses for "today"', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'today',
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('1');
      });

      it('filters expenses for "month"', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'month',
        };
        const result = filterExpenses(mockExpenses, criteria);
        // Should exclude twoMonthsAgo
        expect(result.find((e) => e.id === '4')).toBeUndefined();
      });

      it('filters expenses with custom date range', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'custom',
          customStartDate: toDateInputValue(yesterday),
          customEndDate: toDateInputValue(now),
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.some((e) => e.id === '1')).toBe(true);
        expect(result.some((e) => e.id === '2')).toBe(true);
        expect(result.some((e) => e.id === '4')).toBe(false);
      });

      it('filters with customStartDate only', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'custom',
          customStartDate: toDateInputValue(yesterday),
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.some((e) => e.id === '1')).toBe(true);
        expect(result.some((e) => e.id === '2')).toBe(true);
      });

      it('filters with customEndDate only', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'custom',
          customEndDate: toDateInputValue(twoWeeksAgo),
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.some((e) => e.id === '3')).toBe(true);
        expect(result.some((e) => e.id === '4')).toBe(true);
        expect(result.some((e) => e.id === '1')).toBe(false);
      });
    });

    describe('Text Search Filtering', () => {
      it('matches title case-insensitively', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          searchQuery: 'groceries',
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('1');
      });

      it('matches description case-insensitively', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          searchQuery: 'downtown',
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('2');
      });

      it('returns empty array when search query matches nothing', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          searchQuery: 'NonexistentKeywordXYZ',
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result).toEqual([]);
      });

      it('ignores leading and trailing whitespace', () => {
        const criteria: FilterCriteria = {
          ...DEFAULT_FILTER_CRITERIA,
          searchQuery: '   Uber   ',
        };
        const result = filterExpenses(mockExpenses, criteria);
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('2');
      });
    });
  });

  describe('sortExpenses', () => {
    it('sorts by date_desc (newest first)', () => {
      const sorted = sortExpenses(mockExpenses, 'date_desc');
      expect(sorted[0].id).toBe('1'); // today
      expect(sorted[sorted.length - 1].id).toBe('4'); // 2 months ago
    });

    it('sorts by date_asc (oldest first)', () => {
      const sorted = sortExpenses(mockExpenses, 'date_asc');
      expect(sorted[0].id).toBe('4'); // 2 months ago
      expect(sorted[sorted.length - 1].id).toBe('1'); // today
    });

    it('sorts by amount_desc (highest amount first)', () => {
      const sorted = sortExpenses(mockExpenses, 'amount_desc');
      expect(sorted[0].amountInCents).toBe(12000);
      expect(sorted[sorted.length - 1].amountInCents).toBe(1200);
    });

    it('sorts by amount_asc (lowest amount first)', () => {
      const sorted = sortExpenses(mockExpenses, 'amount_asc');
      expect(sorted[0].amountInCents).toBe(1200);
      expect(sorted[sorted.length - 1].amountInCents).toBe(12000);
    });

    it('sorts by title_asc (alphabetically)', () => {
      const sorted = sortExpenses(mockExpenses, 'title_asc');
      expect(sorted.map((e) => e.title)).toEqual([
        'Electric Bill',
        'Groceries at Walmart',
        'Movie Tickets',
        'Uber Ride',
      ]);
    });
  });

  describe('groupExpenses', () => {
    it('returns empty array when given empty list', () => {
      expect(groupExpenses([], 'category')).toEqual([]);
      expect(groupExpenses([], 'date')).toEqual([]);
      expect(groupExpenses([], 'none')).toEqual([]);
    });

    it('groups by none as a single group with grand totals', () => {
      const groups = groupExpenses(mockExpenses, 'none');
      expect(groups.length).toBe(1);
      expect(groups[0].key).toBe('all');
      expect(groups[0].title).toBe('All Transactions');
      expect(groups[0].totalInCents).toBe(4550 + 1200 + 3000 + 12000);
      expect(groups[0].total).toBe(207.5);
      expect(groups[0].items.length).toBe(4);
    });

    it('groups by category with subtotal calculations', () => {
      const groups = groupExpenses(mockExpenses, 'category');
      expect(groups.length).toBe(4);
      // Sorted by totalInCents desc: utilities (12000), food (4550), entertainment (3000), transport (1200)
      expect(groups[0].key).toBe('utilities');
      expect(groups[0].totalInCents).toBe(12000);
      expect(groups[0].total).toBe(120.0);
      expect(groups[1].key).toBe('food');
    });

    it('groups by category with custom label formatter', () => {
      const labelMap: Record<string, string> = {
        food: '🍔 Food & Dining',
        transport: '🚌 Transit',
        entertainment: '🎮 Fun',
        utilities: '💡 Power',
      };
      const groups = groupExpenses(mockExpenses, 'category', (cat) => labelMap[cat] || cat);
      expect(groups.find((g) => g.key === 'food')?.title).toBe('🍔 Food & Dining');
    });

    it('groups by date with descending dates', () => {
      const groups = groupExpenses(mockExpenses, 'date');
      expect(groups.length).toBe(4);
      expect(groups[0].items[0].id).toBe('1'); // today
      expect(groups[3].items[0].id).toBe('4'); // 2 months ago
    });
  });
});
