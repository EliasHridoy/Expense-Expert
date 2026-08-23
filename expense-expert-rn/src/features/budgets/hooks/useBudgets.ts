import { useContext } from 'react';
import { BudgetContext, BudgetContextType } from '../context/BudgetContext';

/**
 * useBudgets
 *
 * Custom hook exposing monthly category budgets, realtime spending usages,
 * overall budget summary, and mutations (setBudget, deleteBudget).
 */
export const useBudgets = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};
