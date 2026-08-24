import { useContext } from 'react';
import { SavingContext, SavingContextValue } from '../context/SavingContext';

export const useSavings = (): SavingContextValue => {
  const context = useContext(SavingContext);
  if (!context) {
    throw new Error('useSavings must be used within a SavingProvider');
  }
  return context;
};
