import { createContext, use, type PropsWithChildren } from 'react';
import { useWorktreeCatalog } from '../hooks/useWorktreeCatalog/useWorktreeCatalog';
import { useForestNavigation } from './ForestNavigationContext';

export type WorktreeCatalogContextValue = ReturnType<typeof useWorktreeCatalog>;

const WorktreeCatalogContext = createContext<WorktreeCatalogContextValue | null>(null);

export function WorktreeCatalogProvider({ children }: PropsWithChildren) {
  const { screen } = useForestNavigation();
  const catalog = useWorktreeCatalog(screen);

  return <WorktreeCatalogContext value={catalog}>{children}</WorktreeCatalogContext>;
}

export function useWorktreeCatalogContext() {
  const value = use(WorktreeCatalogContext);
  if (value === null) {
    throw new Error('useWorktreeCatalogContext must be used within WorktreeCatalogProvider');
  }
  return value;
}
