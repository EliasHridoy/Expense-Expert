import { createContext } from 'react';
import {
  CategoryBudget,
  SetBudgetDto,
  BudgetUsage,
  BudgetSummary,
} from '../types/budget.types';

export interface BudgetContextType {
  activeMonth: string;
  budgets: CategoryBudget[];
  budgetUsages: BudgetUsage[];
  summary: BudgetSummary;
  isLoading: boolean;
  setActiveMonth: (month: string) => void;
  setBudget: (dto: SetBudgetDto) => Promise<CategoryBudget>;
  deleteBudget: (budgetId: string) => Promise<void>;
  refreshBudgets: () => Promise<void>;
}

export const BudgetContext = createContext<BudgetContextType | null>(null);
