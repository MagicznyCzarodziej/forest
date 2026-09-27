import { createContext, use, type PropsWithChildren } from 'react';
import { useWorktreeOperations } from '../hooks/forestOperations/useWorktreeOperations';
import { useForestNavigation } from './ForestNavigationContext';
import { useProgressContext } from './ProgressContext';
import { useRepositoryListContext } from './RepositoryListContext';
import { useWorktreeCatalogContext } from './WorktreeCatalogContext';

export type WorktreeOperationsContextValue = ReturnType<typeof useWorktreeOperations>;

const WorktreeOperationsContext = createContext<WorktreeOperationsContextValue | null>(null);

export function WorktreeOperationsProvider({ children }: PropsWithChildren) {
  const { setStack } = useForestNavigation();
  const { runProgress, appendProgress } = useProgressContext();
  const repositoryList = useRepositoryListContext();
  const worktreeCatalog = useWorktreeCatalogContext();
  const operations = useWorktreeOperations({
    setStack,
    runProgress,
    appendProgress,
    repositoryList,
    worktreeCatalog,
  });

  return <WorktreeOperationsContext value={operations}>{children}</WorktreeOperationsContext>;
}

export function useWorktreeOperationsContext() {
  const value = use(WorktreeOperationsContext);
  if (value === null) {
    throw new Error('useWorktreeOperationsContext must be used within WorktreeOperationsProvider');
  }
  return value;
}
