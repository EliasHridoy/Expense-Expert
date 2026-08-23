import { useContext } from 'react';
import { CategoryContext, CategoryContextType } from '../context/CategoryContext';

/**
 * Custom hook to access category state, list of categories, and CRUD operations.
 */
export const useCategories = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
