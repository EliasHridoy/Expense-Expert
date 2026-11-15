import { ExpenseCategory } from './expense.model';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  price: number;
  checked: boolean;
  subcategory?: string | null;
}

export enum ShoppingListStatus {
  Planned = 'planned',
  Completed = 'completed',
}

export interface ShoppingList {
  id: string;
  name: string;
  category: ExpenseCategory | string;
  subcategory?: string | null;
  date: Date;
  status: ShoppingListStatus;
  items: ShoppingItem[];
  totalAmount: number;
  expenseId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShoppingListDto {
  name: string;
  category: ExpenseCategory | string;
  subcategory?: string | null;
  date: Date;
  status?: ShoppingListStatus;
  items: ShoppingItem[];
  totalAmount?: number;
  expenseId?: string | null;
}

export interface UpdateShoppingListDto {
  name?: string;
  category?: ExpenseCategory | string;
  subcategory?: string | null;
  date?: Date;
  status?: ShoppingListStatus;
  items?: ShoppingItem[];
  totalAmount?: number;
  expenseId?: string | null;
}
