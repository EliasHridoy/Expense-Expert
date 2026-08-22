export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  createdAt?: Date | string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  budgetLimit?: number; // represented in integer cents
  isDefault?: boolean;
  userId?: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number; // stored in integer cents to prevent floating point issues
  categoryId: string;
  categoryName?: string;
  date: string; // ISO-8601 string or YYYY-MM-DD
  note?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number; // integer cents
  period: string; // e.g. "2026-08"
  spent?: number; // integer cents
}
