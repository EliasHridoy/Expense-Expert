import { createContext } from 'react';
import {
  MonthSummary,
  MonthlyTrend,
  CategoryBreakdown,
} from '../types/dashboard.types';

export interface DashboardContextType {
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  summary: MonthSummary | null;
  trends: MonthlyTrend[];
  breakdowns: CategoryBreakdown[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);
