import type { Dispatch, SetStateAction } from 'react';
import type { useRepositoryList } from '../useRepositoryList';
import type { ScreenState } from '../../navigation/navigation';

export interface WorktreeCatalogActions {
  load: (repositoryName: string, repositoryPath: string) => Promise<void>;
  invalidate: () => void;
}

export interface OperationDeps {
  setStack: Dispatch<SetStateAction<ScreenState[]>>;
  runProgress: (title: string, action: () => Promise<void>) => Promise<void>;
  appendProgress: (line: string) => void;
  repositoryList: Pick<
    ReturnType<typeof useRepositoryList>,
    'markOpened' | 'markCloned' | 'markConverted'
  >;
  worktreeCatalog: WorktreeCatalogActions;
}
