import { useContext } from 'react';
import { DataContext } from './GlobalState';

// Add this to your GlobalState.tsx
export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
