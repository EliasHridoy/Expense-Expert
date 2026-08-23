/**
 * Dashboard Types
 *
 * Core financial data models, summary structures, and analytical breakdown interfaces.
 * Supports both integer cents (*InCents) and floating currency representation.
 */

export interface MonthSummary {
  month: string;
  totalIncomeInCents: number;
  totalIncome: number;
  currentMonthIncomeInCents: number;
  currentMonthIncome: number;
  previousMonthRemainingInCents: number;
  previousMonthRemaining: number;
  totalExpensesInCents: number;
  totalExpenses: number;
  totalSavingsInCents: number;
  totalSavings: number;
  remainingInCents: number;
  remaining: number;
  loansTakenIncomeInCents: number;
  loansTakenIncome: number;
  expenseCount: number;
}

export interface MonthlyTrend {
  month: string;
  totalExpensesInCents: number;
  totalExpenses: number;
  totalSavingsInCents: number;
  totalSavings: number;
}

export interface CategoryBreakdown {
  category: string;
  totalInCents: number;
  total: number;
  count: number;
  percentage: number;
  color?: string;
}

export interface UserProfileFinancials {
  monthlySalary?: number;
  salaries?: Record<string, number>;
  createdAt?: string | Date;
}

export interface RawFinancialData {
  month: string;
  profile: UserProfileFinancials | null;
  expenses: Array<{
    id?: string;
    amount?: number;
    amountInCents?: number;
    category: string;
    month: string;
  }>;
  savingEntries: Array<{
    id?: string;
    amount?: number;
    amountInCents?: number;
    type: 'deposit' | 'withdrawal';
    month: string;
  }>;
  incomeEntries: Array<{
    id?: string;
    amount?: number;
    amountInCents?: number;
    month: string;
  }>;
  loansTaken: Array<{
    id?: string;
    amount?: number;
    amountInCents?: number;
    month: string;
  }>;
}

export interface DashboardFilterOptions {
  activeMonth: string;
  historicalMonthsCount?: number;
}
