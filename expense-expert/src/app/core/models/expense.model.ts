export enum ExpenseCategory {
  Food = 'food',
  Transport = 'transport',
  Entertainment = 'entertainment',
  Utilities = 'utilities',
  Savings = 'savings',
  LoanRepayment = 'loan_repayment',
  Other = 'other',
}

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory | string;
  subcategory?: string | null;
  date: Date;
  month: string; // "YYYY-MM"
  isLoan: boolean;
  loanPersonId: string | null;
  loanCleared: boolean;
  loanRepaid: number;
  loanTakenId: string | null; // if this expense is a repayment for a LoanTaken record
  draftId: string | null;
  installmentIndex: number | null;
  shoppingListId?: string | null;
  shoppingListName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDto {
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory | string;
  subcategory?: string | null;
  date: Date;
  isLoan: boolean;
  loanPersonId: string | null;
  loanTakenId?: string | null;
  draftId?: string | null;
  installmentIndex?: number | null;
  shoppingListId?: string | null;
  shoppingListName?: string | null;
}

export interface UpdateExpenseDto {
  title?: string;
  description?: string;
  amount?: number;
  category?: ExpenseCategory | string;
  subcategory?: string | null;
  date?: Date;
  isLoan?: boolean;
  loanPersonId?: string | null;
  loanCleared?: boolean;
  shoppingListId?: string | null;
  shoppingListName?: string | null;
}

export const EXPENSE_CATEGORIES = [
  { value: ExpenseCategory.Food, label: 'Food' },
  { value: ExpenseCategory.Transport, label: 'Transport' },
  { value: ExpenseCategory.Entertainment, label: 'Entertainment' },
  { value: ExpenseCategory.Utilities, label: 'Utilities' },
  { value: ExpenseCategory.Savings, label: 'Savings' },
  { value: ExpenseCategory.LoanRepayment, label: 'Loan Repayment' },
  { value: ExpenseCategory.Other, label: 'Other' },
];
