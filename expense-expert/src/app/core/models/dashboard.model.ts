export interface MonthSummary {
  totalExpenses: number;
  totalSavings: number;
  balance: number;
  expenseCount: number;
}

export interface MonthlyTrend {
  month: string;
  totalExpenses: number;
  totalSavings: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}
