import type { PropsWithChildren } from 'react';
import { ProgressProvider } from './ProgressContext';
import { RepositoryListProvider } from './RepositoryListContext';
import { RepositoryOperationsProvider } from './RepositoryOperationsContext';
import { WorktreeCatalogProvider } from './WorktreeCatalogContext';
import { WorktreeOperationsProvider } from './WorktreeOperationsContext';

export function ForestUiProviders({ children }: PropsWithChildren) {
  return (
    <RepositoryListProvider>
      <WorktreeCatalogProvider>
        <ProgressProvider>
          <RepositoryOperationsProvider>
            <WorktreeOperationsProvider>{children}</WorktreeOperationsProvider>
          </RepositoryOperationsProvider>
        </ProgressProvider>
      </WorktreeCatalogProvider>
    </RepositoryListProvider>
  );
}
