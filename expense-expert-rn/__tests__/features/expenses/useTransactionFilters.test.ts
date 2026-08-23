import { renderHook, act } from '@testing-library/react-native';
import { useTransactionFilters } from '../../../src/features/expenses/hooks/useTransactionFilters';
import { Expense } from '../../../src/features/expenses/types/expense.types';

describe('useTransactionFilters', () => {
  const now = new Date();
  const todayISO = now.toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const mockExpenses: Expense[] = [
    {
      id: '1',
      title: 'Coffee at Starbucks',
      description: 'Morning latte',
      amount: 5.5,
      amountInCents: 550,
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
      title: 'Bus Pass',
      description: 'Monthly transit card',
      amount: 45.0,
      amountInCents: 4500,
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
      title: 'Pizza Dinner',
      description: 'Takeout with family',
      amount: 30.0,
      amountInCents: 3000,
      category: 'food',
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
  ];

  it('initializes with default criteria and calculates totalFilteredCents', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    expect(result.current.criteria.category).toBe('all');
    expect(result.current.criteria.dateRange).toBe('all');
    expect(result.current.criteria.searchQuery).toBe('');
    expect(result.current.criteria.sortBy).toBe('date_desc');
    expect(result.current.criteria.groupBy).toBe('none');
    expect(result.current.viewMode).toBe('list');

    expect(result.current.filteredCount).toBe(3);
    expect(result.current.totalFilteredCents).toBe(550 + 4500 + 3000); // 8050
    expect(result.current.totalFiltered).toBe(80.5);
  });

  it('handles empty expense list safely', () => {
    const { result } = renderHook(() => useTransactionFilters([]));

    expect(result.current.filteredCount).toBe(0);
    expect(result.current.totalFilteredCents).toBe(0);
    expect(result.current.totalFiltered).toBe(0);
    expect(result.current.groupedExpenses).toEqual([]);
  });

  it('updates category filter via setCategory', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    act(() => {
      result.current.setCategory('food');
    });

    expect(result.current.criteria.category).toBe('food');
    expect(result.current.filteredCount).toBe(2);
    expect(result.current.totalFilteredCents).toBe(3550);
    expect(result.current.totalFiltered).toBe(35.5);
  });

  it('updates date range via setDateRange', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    act(() => {
      result.current.setDateRange('today');
    });

    expect(result.current.criteria.dateRange).toBe('today');
    expect(result.current.filteredCount).toBe(1);
    expect(result.current.filteredExpenses[0].id).toBe('1');
  });

  it('updates custom date range via setCustomDateRange', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    act(() => {
      result.current.setCustomDateRange('2026-08-01', '2026-08-31');
    });

    expect(result.current.criteria.dateRange).toBe('custom');
    expect(result.current.criteria.customStartDate).toBe('2026-08-01');
    expect(result.current.criteria.customEndDate).toBe('2026-08-31');
  });

  it('updates search query via setSearchQuery', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    act(() => {
      result.current.setSearchQuery('Starbucks');
    });

    expect(result.current.criteria.searchQuery).toBe('Starbucks');
    expect(result.current.filteredCount).toBe(1);
    expect(result.current.filteredExpenses[0].id).toBe('1');
  });

  it('updates sort option via setSortBy', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    act(() => {
      result.current.setSortBy('amount_desc');
    });

    expect(result.current.criteria.sortBy).toBe('amount_desc');
    expect(result.current.filteredExpenses[0].id).toBe('2'); // Bus Pass: $45
    expect(result.current.filteredExpenses[2].id).toBe('1'); // Coffee: $5.5
  });

  it('updates grouping via setGroupBy', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    act(() => {
      result.current.setGroupBy('category');
    });

    expect(result.current.criteria.groupBy).toBe('category');
    expect(result.current.groupedExpenses.length).toBe(2); // transport ($45) and food ($35.5)
    expect(result.current.groupedExpenses[0].key).toBe('transport');
    expect(result.current.groupedExpenses[0].totalInCents).toBe(4500);
    expect(result.current.groupedExpenses[1].key).toBe('food');
    expect(result.current.groupedExpenses[1].totalInCents).toBe(3550);
  });

  it('toggles view mode between list and grid', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    expect(result.current.viewMode).toBe('list');

    act(() => {
      result.current.toggleViewMode();
    });
    expect(result.current.viewMode).toBe('grid');

    act(() => {
      result.current.setViewMode('list');
    });
    expect(result.current.viewMode).toBe('list');
  });

  it('resets filters back to default criteria', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses));

    act(() => {
      result.current.setCategory('food');
      result.current.setSearchQuery('pizza');
      result.current.setSortBy('amount_asc');
      result.current.setGroupBy('category');
    });

    expect(result.current.criteria.category).toBe('food');
    expect(result.current.filteredCount).toBe(1);

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.criteria.category).toBe('all');
    expect(result.current.criteria.searchQuery).toBe('');
    expect(result.current.criteria.sortBy).toBe('date_desc');
    expect(result.current.criteria.groupBy).toBe('none');
    expect(result.current.filteredCount).toBe(3);
  });
});
