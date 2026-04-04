export enum ExpenseCategory {
  Food = 'food',
  Transport = 'transport',
  Entertainment = 'entertainment',
  Utilities = 'utilities',
  Savings = 'savings',
  Other = 'other',
}

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  month: string; // "YYYY-MM"
  isLoan: boolean;
  loanPersonId: string | null;
  loanCleared: boolean;
  loanRepaid: number; // amount repaid so far (partial repayment)
  draftId: string | null;
  installmentIndex: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDto {
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  isLoan: boolean;
  loanPersonId: string | null;
  draftId?: string | null;
  installmentIndex?: number | null;
}

export interface UpdateExpenseDto {
  title?: string;
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  date?: Date;
  isLoan?: boolean;
  loanPersonId?: string | null;
  loanCleared?: boolean;
}

export const EXPENSE_CATEGORIES = [
  { value: ExpenseCategory.Food, label: 'Food' },
  { value: ExpenseCategory.Transport, label: 'Transport' },
  { value: ExpenseCategory.Entertainment, label: 'Entertainment' },
  { value: ExpenseCategory.Utilities, label: 'Utilities' },
  { value: ExpenseCategory.Savings, label: 'Savings' },
  { value: ExpenseCategory.Other, label: 'Other' },
];
