import { createContext } from 'react';
import { CategoryItem } from '../types/category.types';

export interface CategoryContextType {
  categories: CategoryItem[];
  builtInCategories: CategoryItem[];
  customCategories: CategoryItem[];
  isLoading: boolean;
  addCategory: (name: string, icon: string) => Promise<CategoryItem>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryByValue: (value: string) => CategoryItem;
  refreshCategories: () => Promise<void>;
}

export const CategoryContext = createContext<CategoryContextType | undefined>(undefined);
