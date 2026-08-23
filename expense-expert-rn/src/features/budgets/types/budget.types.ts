export type ThresholdState = 'under' | 'warning' | 'exceeded';

export interface CategoryBudget {
  id: string; // composite key e.g. "2026-08_food"
  userId: string;
  category: string;
  month: string; // "YYYY-MM"
  limit: number; // decimal (e.g. 500)
  limitInCents: number; // integer (e.g. 50000)
  createdAt: string;
  updatedAt: string;
}

export interface SetBudgetDto {
  category: string;
  month: string;
  limit: number | string;
}

export interface BudgetUsage {
  budgetId: string;
  category: string;
  month: string;
  limitInCents: number;
  limit: number;
  spentInCents: number;
  spent: number;
  remainingInCents: number;
  remaining: number;
  percentage: number;
  thresholdState: ThresholdState;
  isExceeded: boolean;
  isNearLimit: boolean;
}

export interface BudgetSummary {
  totalLimitInCents: number;
  totalLimit: number;
  totalSpentInCents: number;
  totalSpent: number;
  totalRemainingInCents: number;
  totalRemaining: number;
  percentage: number;
  thresholdState: ThresholdState;
}

export interface ThresholdColorStyles {
  barColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
}
