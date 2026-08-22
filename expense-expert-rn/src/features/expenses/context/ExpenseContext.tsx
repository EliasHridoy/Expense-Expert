import { createContext } from 'react';
import { Expense, CreateExpenseDto, UpdateExpenseDto } from '../types/expense.types';

export interface ExpenseContextValue {
  expenses: Expense[];
  pendingSyncCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  addExpense: (dto: CreateExpenseDto) => Promise<Expense>;
  updateExpense: (id: string, dto: UpdateExpenseDto) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpenseById: (id: string) => Promise<Expense | undefined>;
  syncQueue: () => Promise<number>;
  refreshExpenses: (month?: string) => Promise<void>;
}

export const ExpenseContext = createContext<ExpenseContextValue | null>(null);
