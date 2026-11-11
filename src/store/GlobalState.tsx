import { createContext, useReducer, ReactNode, Dispatch } from 'react';
import reducers, { AppState } from './Reducers';
import { Action } from './types';
import { initialAppState } from './initial-state';

// Define the context shape
interface ContextProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export const DataContext = createContext<ContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducers, initialAppState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};
