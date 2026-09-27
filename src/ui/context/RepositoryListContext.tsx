import { createContext, use, type PropsWithChildren } from 'react';
import { useRepositoryList } from '../hooks/useRepositoryList';

export type RepositoryListContextValue = ReturnType<typeof useRepositoryList>;

const RepositoryListContext = createContext<RepositoryListContextValue | null>(null);

export function RepositoryListProvider({ children }: PropsWithChildren) {
  const repositoryList = useRepositoryList();

  return <RepositoryListContext value={repositoryList}>{children}</RepositoryListContext>;
}

export function useRepositoryListContext() {
  const value = use(RepositoryListContext);
  if (value === null) {
    throw new Error('useRepositoryListContext must be used within RepositoryListProvider');
  }
  return value;
}
