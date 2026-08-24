import { useContext } from 'react';
import { DraftContext, DraftContextValue } from '../context/DraftContext';

export const useDrafts = (): DraftContextValue => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDrafts must be used within a DraftProvider');
  }
  return context;
};
