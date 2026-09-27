import { createContext, use, type PropsWithChildren } from 'react';
import { useForestOperations } from '../hooks/useForestOperations';
import { useWorktreeCatalog } from '../hooks/useWorktreeCatalog/useWorktreeCatalog';
import { useForestNavigation } from './ForestNavigationContext';

export type ForestOperationsContextValue = ReturnType<typeof useForestOperations> &
  Pick<ReturnType<typeof useWorktreeCatalog>, 'worktrees' | 'branches' | 'ready'>;

const ForestOperationsContext = createContext<ForestOperationsContextValue | null>(null);

export function ForestOperationsProvider({ children }: PropsWithChildren) {
  const { screen, setStack } = useForestNavigation();
  const worktreeCatalog = useWorktreeCatalog(screen);
  const operations = useForestOperations({ setStack, worktreeCatalog });

  return (
    <ForestOperationsContext
      value={{
        ...operations,
        worktrees: worktreeCatalog.worktrees,
        branches: worktreeCatalog.branches,
        ready: worktreeCatalog.ready,
      }}
    >
      {children}
    </ForestOperationsContext>
  );
}

export function useForestOperationsContext() {
  const operations = use(ForestOperationsContext);
  if (operations === null) {
    throw new Error('useForestOperationsContext must be used within ForestOperationsProvider');
  }
  return operations;
}
