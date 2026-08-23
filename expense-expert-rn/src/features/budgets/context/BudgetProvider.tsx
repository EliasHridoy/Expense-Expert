import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { ExpenseContext } from '../../expenses/context/ExpenseContext';
import { BudgetService } from '../services/budget.service';
import {
  CategoryBudget,
  SetBudgetDto,
  BudgetUsage,
  BudgetSummary,
} from '../types/budget.types';
import {
  calculateBudgetUsage,
  calculateTotalBudgetSummary,
} from '../utils/budget.util';
import { BudgetContext, BudgetContextType } from './BudgetContext';

export interface BudgetProviderProps {
  children: React.ReactNode;
  initialMonth?: string;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({
  children,
  initialMonth,
}) => {
  const { user } = useAuth();
  const expenseContext = useContext(ExpenseContext);
  const expenses = useMemo(() => expenseContext?.expenses ?? [], [expenseContext?.expenses]);

  const [activeMonth, setActiveMonthState] = useState<string>(() => {
    if (initialMonth) return initialMonth;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadBudgets = useCallback(async (userId: string, month: string) => {
    if (!userId || !month) {
      setBudgets([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await BudgetService.getBudgetsByMonth(userId, month);
      setBudgets(data);
    } catch (error) {
      console.warn('Failed to load budgets in BudgetProvider:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadBudgets(user.uid, activeMonth);
    } else {
      setBudgets([]);
      setIsLoading(false);
    }
  }, [user?.uid, activeMonth, loadBudgets]);

  const setActiveMonth = useCallback((month: string) => {
    setActiveMonthState(month);
  }, []);

  const refreshBudgets = useCallback(async () => {
    if (user?.uid) {
      await loadBudgets(user.uid, activeMonth);
    }
  }, [user?.uid, activeMonth, loadBudgets]);

  const setBudget = useCallback(
    async (dto: SetBudgetDto): Promise<CategoryBudget> => {
      if (!user?.uid) {
        throw new Error('User must be logged in to set category budgets');
      }

      const updated = await BudgetService.setCategoryBudget(user.uid, dto);

      setBudgets((prev) => {
        // If modified budget belongs to active month, update in state
        if (dto.month === activeMonth) {
          const index = prev.findIndex((b) => b.id === updated.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updated;
            return next;
          }
          return [...prev, updated];
        }
        return prev;
      });

      return updated;
    },
    [user?.uid, activeMonth]
  );

  const deleteBudget = useCallback(
    async (budgetId: string): Promise<void> => {
      if (!user?.uid) {
        throw new Error('User must be logged in to delete category budgets');
      }

      await BudgetService.deleteCategoryBudget(user.uid, budgetId, activeMonth);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    },
    [user?.uid, activeMonth]
  );

  const budgetUsages = useMemo<BudgetUsage[]>(() => {
    return budgets.map((budget) => calculateBudgetUsage(budget, expenses));
  }, [budgets, expenses]);

  const summary = useMemo<BudgetSummary>(() => {
    return calculateTotalBudgetSummary(budgets, expenses, activeMonth);
  }, [budgets, expenses, activeMonth]);

  const contextValue = useMemo<BudgetContextType>(
    () => ({
      activeMonth,
      budgets,
      budgetUsages,
      summary,
      isLoading,
      setActiveMonth,
      setBudget,
      deleteBudget,
      refreshBudgets,
    }),
    [
      activeMonth,
      budgets,
      budgetUsages,
      summary,
      isLoading,
      setActiveMonth,
      setBudget,
      deleteBudget,
      refreshBudgets,
    ]
  );

  return (
    <BudgetContext.Provider value={contextValue}>
      {children}
    </BudgetContext.Provider>
  );
};
