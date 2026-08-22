import { ExpenseCategory } from './category.types';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number; // Decimal dollar amount (e.g. 19.99)
  amountInCents: number; // Integer cents (e.g. 1999)
  category: ExpenseCategory | string;
  date: string; // ISO string (e.g. "2026-08-23T00:00:00.000Z")
  month: string; // "YYYY-MM" partition
  isLoan: boolean;
  loanPersonId: string | null;
  loanCleared: boolean;
  loanRepaid: number;
  loanTakenId: string | null;
  draftId: string | null;
  installmentIndex: number | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  syncStatus?: SyncStatus;
}

export interface CreateExpenseDto {
  title: string;
  description?: string;
  amount: number | string;
  category: ExpenseCategory | string;
  date: string | Date;
  isLoan?: boolean;
  loanPersonId?: string | null;
  loanTakenId?: string | null;
  draftId?: string | null;
  installmentIndex?: number | null;
}

export interface UpdateExpenseDto {
  title?: string;
  description?: string;
  amount?: number | string;
  category?: ExpenseCategory | string;
  date?: string | Date;
  isLoan?: boolean;
  loanPersonId?: string | null;
  loanCleared?: boolean;
}

export interface QueuedMutation {
  id: string; // Client mutation unique ID
  type: 'CREATE_EXPENSE' | 'UPDATE_EXPENSE' | 'DELETE_EXPENSE';
  userId: string;
  expenseId: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}
