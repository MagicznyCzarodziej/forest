import { createContext, use, type PropsWithChildren } from 'react';
import { useRepositoryOperations } from '../hooks/forestOperations/useRepositoryOperations';
import { useForestNavigation } from './ForestNavigationContext';
import { useProgressContext } from './ProgressContext';
import { useRepositoryListContext } from './RepositoryListContext';
import { useWorktreeCatalogContext } from './WorktreeCatalogContext';

export type RepositoryOperationsContextValue = ReturnType<typeof useRepositoryOperations>;

const RepositoryOperationsContext = createContext<RepositoryOperationsContextValue | null>(null);

export function RepositoryOperationsProvider({ children }: PropsWithChildren) {
  const { setStack } = useForestNavigation();
  const { runProgress, appendProgress } = useProgressContext();
  const repositoryList = useRepositoryListContext();
  const worktreeCatalog = useWorktreeCatalogContext();
  const operations = useRepositoryOperations({
    setStack,
    runProgress,
    appendProgress,
    repositoryList,
    worktreeCatalog,
  });

  return <RepositoryOperationsContext value={operations}>{children}</RepositoryOperationsContext>;
}

export function useRepositoryOperationsContext() {
  const value = use(RepositoryOperationsContext);
  if (value === null) {
    throw new Error(
      'useRepositoryOperationsContext must be used within RepositoryOperationsProvider',
    );
  }
  return value;
}
