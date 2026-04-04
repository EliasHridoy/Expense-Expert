export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  remaining: number;
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
