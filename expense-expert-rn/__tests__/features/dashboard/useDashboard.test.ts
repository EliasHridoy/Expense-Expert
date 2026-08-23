import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { DashboardProvider } from '../../../src/features/dashboard/context/DashboardProvider';
import { useDashboard } from '../../../src/features/dashboard/hooks/useDashboard';
import { DashboardService } from '../../../src/features/dashboard/services/dashboard.service';
import { useAuth } from '../../../src/features/auth/hooks/useAuth';
import {
  MonthSummary,
  MonthlyTrend,
  CategoryBreakdown,
} from '../../../src/features/dashboard/types/dashboard.types';

jest.mock('../../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../src/features/dashboard/services/dashboard.service', () => ({
  DashboardService: {
    getMonthSummary: jest.fn(),
    getMonthlyTrend: jest.fn(),
    getCategoryBreakdown: jest.fn(),
  },
}));

describe('useDashboard & DashboardProvider', () => {
  const mockUser = { uid: 'dash_user_123', email: 'dashboard@example.com' };

  const mockSummary: MonthSummary = {
    month: '2026-08',
    totalIncomeInCents: 500000,
    totalIncome: 5000,
    currentMonthIncomeInCents: 500000,
    currentMonthIncome: 5000,
    previousMonthRemainingInCents: 0,
    previousMonthRemaining: 0,
    totalExpensesInCents: 150000,
    totalExpenses: 1500,
    totalSavingsInCents: 100000,
    totalSavings: 1000,
    remainingInCents: 250000,
    remaining: 2500,
    loansTakenIncomeInCents: 0,
    loansTakenIncome: 0,
    expenseCount: 12,
  };

  const mockTrends: MonthlyTrend[] = [
    {
      month: '2026-03',
      totalExpensesInCents: 120000,
      totalExpenses: 1200,
      totalSavingsInCents: 80000,
      totalSavings: 800,
    },
    {
      month: '2026-08',
      totalExpensesInCents: 150000,
      totalExpenses: 1500,
      totalSavingsInCents: 100000,
      totalSavings: 1000,
    },
  ];

  const mockBreakdowns: CategoryBreakdown[] = [
    {
      category: 'Food',
      totalInCents: 90000,
      total: 900,
      count: 8,
      percentage: 60,
      color: '#6366f1',
    },
    {
      category: 'Transport',
      totalInCents: 60000,
      total: 600,
      count: 4,
      percentage: 40,
      color: '#10b981',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (DashboardService.getMonthSummary as jest.Mock).mockResolvedValue(mockSummary);
    (DashboardService.getMonthlyTrend as jest.Mock).mockResolvedValue(mockTrends);
    (DashboardService.getCategoryBreakdown as jest.Mock).mockResolvedValue(mockBreakdowns);
  });

  const createWrapper = (initialMonth = '2026-08') => {
    return ({ children }: { children?: React.ReactNode }) =>
      React.createElement(DashboardProvider, { initialMonth }, children);
  };

  it('throws error when useDashboard is called outside DashboardProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useDashboard())).toThrow(
      'useDashboard must be used within a DashboardProvider'
    );
    consoleSpy.mockRestore();
  });

  it('initializes and loads summary, trends, and category breakdown for active month', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper('2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(DashboardService.getMonthSummary).toHaveBeenCalledWith('dash_user_123', '2026-08');
    expect(DashboardService.getMonthlyTrend).toHaveBeenCalledWith('dash_user_123', 6, '2026-08');
    expect(DashboardService.getCategoryBreakdown).toHaveBeenCalledWith('dash_user_123', '2026-08');

    expect(result.current.activeMonth).toBe('2026-08');
    expect(result.current.summary).toEqual(mockSummary);
    expect(result.current.trends).toEqual(mockTrends);
    expect(result.current.breakdowns).toEqual(mockBreakdowns);
    expect(result.current.error).toBeNull();
  });

  it('re-fetches dashboard data when setActiveMonth is called', async () => {
    const septSummary: MonthSummary = {
      ...mockSummary,
      month: '2026-09',
      totalExpensesInCents: 200000,
    };
    (DashboardService.getMonthSummary as jest.Mock).mockResolvedValueOnce(mockSummary);
    (DashboardService.getMonthSummary as jest.Mock).mockResolvedValueOnce(septSummary);

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper('2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setActiveMonth('2026-09');
    });

    await waitFor(() => {
      expect(result.current.activeMonth).toBe('2026-09');
    });

    expect(DashboardService.getMonthSummary).toHaveBeenCalledWith('dash_user_123', '2026-09');
    expect(DashboardService.getMonthlyTrend).toHaveBeenCalledWith('dash_user_123', 6, '2026-09');
    expect(DashboardService.getCategoryBreakdown).toHaveBeenCalledWith('dash_user_123', '2026-09');
  });

  it('triggers refresh with isRefreshing state transitions', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper('2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(DashboardService.getMonthSummary).toHaveBeenCalledTimes(2);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('handles service errors gracefully and populates error state', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (DashboardService.getMonthSummary as jest.Mock).mockRejectedValueOnce(
      new Error('Firestore connection timed out')
    );

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper('2026-08'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Firestore connection timed out');
    consoleSpy.mockRestore();
  });

  it('clears state when user logs out', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper('2026-08'),
    });

    expect(result.current.summary).toBeNull();
    expect(result.current.trends).toEqual([]);
    expect(result.current.breakdowns).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
