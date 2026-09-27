import { createContext, type PropsWithChildren, use } from 'react';
import { useProgressOperation } from '../hooks/forestOperations/useProgressOperation';
import { useForestNavigation } from './ForestNavigationContext';

export type ProgressContextValue = ReturnType<typeof useProgressOperation>;

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: PropsWithChildren) {
  const { setStack } = useForestNavigation();
  const progress = useProgressOperation({ setStack });

  return <ProgressContext value={progress}>{children}</ProgressContext>;
}

export function useProgressContext() {
  const value = use(ProgressContext);
  if (value === null) {
    throw new Error('useProgressContext must be used within ProgressProvider');
  }
  return value;
}
