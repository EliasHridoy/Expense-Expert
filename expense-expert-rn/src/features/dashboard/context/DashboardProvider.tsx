import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../auth/hooks/useAuth';
import { ExpenseContext } from '../../expenses/context/ExpenseContext';
import { DashboardService } from '../services/dashboard.service';
import {
  MonthSummary,
  MonthlyTrend,
  CategoryBreakdown,
} from '../types/dashboard.types';
import { DashboardContext, DashboardContextType } from './DashboardContext';

export interface DashboardProviderProps {
  children?: React.ReactNode;
  initialMonth?: string;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  initialMonth,
}) => {
  const { user } = useAuth();

  const [activeMonth, setActiveMonthState] = useState<string>(() => {
    if (initialMonth) return initialMonth;
    return format(new Date(), 'yyyy-MM');
  });

  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [breakdowns, setBreakdowns] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(
    async (userId: string, month: string, isRefresh = false) => {
      if (!userId) {
        setSummary(null);
        setTrends([]);
        setBreakdowns([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const [monthSummary, trendSeries, categoryBreakdowns] =
          await Promise.all([
            DashboardService.getMonthSummary(userId, month),
            DashboardService.getMonthlyTrend(userId, 6, month),
            DashboardService.getCategoryBreakdown(userId, month),
          ]);

        setSummary(monthSummary);
        setTrends(trendSeries);
        setBreakdowns(categoryBreakdowns);
      } catch (err: any) {
        console.warn('Failed to load dashboard data:', err);
        setError(err?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData(user.uid, activeMonth);
    } else {
      setSummary(null);
      setTrends([]);
      setBreakdowns([]);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid, activeMonth, loadDashboardData]);

  // Reactive recalculation when underlying expenses update
  const expenseContext = useContext(ExpenseContext);
  const expenses = expenseContext?.expenses;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (user?.uid && expenses !== undefined) {
      loadDashboardData(user.uid, activeMonth, true);
    }
  }, [expenses, user?.uid, activeMonth, loadDashboardData]);

  const setActiveMonth = useCallback((month: string) => {
    setActiveMonthState(month);
  }, []);

  const refresh = useCallback(async () => {
    if (user?.uid) {
      await loadDashboardData(user.uid, activeMonth, true);
    }
  }, [user?.uid, activeMonth, loadDashboardData]);

  const contextValue = useMemo<DashboardContextType>(
    () => ({
      activeMonth,
      setActiveMonth,
      summary,
      trends,
      breakdowns,
      isLoading,
      isRefreshing,
      error,
      refresh,
    }),
    [
      activeMonth,
      setActiveMonth,
      summary,
      trends,
      breakdowns,
      isLoading,
      isRefreshing,
      error,
      refresh,
    ]
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};
