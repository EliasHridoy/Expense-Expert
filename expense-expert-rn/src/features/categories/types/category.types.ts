export enum ExpenseCategory {
  Food = 'food',
  Transport = 'transport',
  Entertainment = 'entertainment',
  Utilities = 'utilities',
  Savings = 'savings',
  LoanRepayment = 'loan_repayment',
  Other = 'other',
}

export interface CategoryItem {
  value: string;
  label: string;
  icon: string;
  isCustom: boolean;
  id?: string;
  color?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  icon: string;
}

export const CATEGORY_ICONS: string[] = [
  '🍔', '🚌', '💡', '💊', '🛍️', '🎮', '✈️', '🎁', '📚', '🏠',
  '📁', '💰', '🎵', '🏋️', '🐾', '☕', '🍕', '👶', '💻', '📱',
  '🎨', '⚽', '💼', '🔧', '🌐', '📦', '🎓', '🏖️', '🚗', '💳',
];

export const BUILTIN_CATEGORY_ICONS: Record<string, string> = {
  [ExpenseCategory.Food]: '🍔',
  [ExpenseCategory.Transport]: '🚌',
  [ExpenseCategory.Entertainment]: '🎮',
  [ExpenseCategory.Utilities]: '💡',
  [ExpenseCategory.Savings]: '💰',
  [ExpenseCategory.LoanRepayment]: '💳',
  [ExpenseCategory.Other]: '📁',
};

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: ExpenseCategory.Food, label: 'Food', icon: '🍔' },
  { value: ExpenseCategory.Transport, label: 'Transport', icon: '🚌' },
  { value: ExpenseCategory.Entertainment, label: 'Entertainment', icon: '🎮' },
  { value: ExpenseCategory.Utilities, label: 'Utilities', icon: '💡' },
  { value: ExpenseCategory.Savings, label: 'Savings', icon: '💰' },
  { value: ExpenseCategory.LoanRepayment, label: 'Loan Repayment', icon: '💳' },
  { value: ExpenseCategory.Other, label: 'Other', icon: '📁' },
];
