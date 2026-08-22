import { useContext } from 'react';
import { ExpenseContext, ExpenseContextValue } from '../context/ExpenseContext';

/**
 * useExpenses
 * 
 * Custom hook exposing transaction actions, active expenses list, pending sync status,
 * and background synchronization triggers.
 */
export const useExpenses = (): ExpenseContextValue => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
