import { useCallback, useEffect, useRef, useState } from 'react';
import { sortBranches } from './sortBranches';
import type { WorktreeEntry } from '../../../domain/types';
import {
  DEFAULT_BRANCH,
  detectDefaultBranchFromBare,
} from '../../../infrastructure/git/default-branch';
import type { ScreenState } from '../../navigation/navigation';
import { bareRepositoryPath } from '../../../domain/repositories/repository-structure';
import { buildWorktreeList } from '../../../domain/worktrees/worktree-catalog';
import { listRemoteBranches, scanWorktrees } from '../../../domain/worktrees/scan-worktrees';
import { fetchOriginBranches } from '../../../infrastructure/git/fetch-origin';
import { useForest } from '../useForest';

export interface LoadWorktreeCatalogOptions {
  refreshFromOrigin?: boolean;
}

function activeRepository(screen: ScreenState) {
  if (screen.type !== 'worktrees' && screen.type !== 'branches') {
    return null;
  }
  return {
    name: screen.repositoryName,
    path: screen.repositoryPath,
  };
}

export function useWorktreeCatalog(screen: ScreenState) {
  const { config, stateStore } = useForest();
  const [worktrees, setWorktrees] = useState<WorktreeEntry[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loadedRepositoryPath, setLoadedRepositoryPath] = useState<string | null>(null);
  const [refreshingBranches, setRefreshingBranches] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(
    async (
      repositoryName: string,
      repositoryPath: string,
      options: LoadWorktreeCatalogOptions = {},
    ) => {
      const request = ++requestRef.current;

      if (options.refreshFromOrigin) {
        await Promise.resolve();
        if (request !== requestRef.current) {
          return;
        }
        setLoadedRepositoryPath(null);
        setRefreshingBranches(true);
        try {
          await fetchOriginBranches(bareRepositoryPath(repositoryPath));
        } catch {
          // Offline or auth errors: fall back to refs already on disk.
        } finally {
          if (request === requestRef.current) {
            setRefreshingBranches(false);
          }
        }
      }

      if (request !== requestRef.current) {
        return;
      }

      const rawWorktrees = await scanWorktrees(
        repositoryPath,
        repositoryName,
        stateStore,
        config.repositoryWorktreeSeparator,
      );
      const remoteBranches = await listRemoteBranches(repositoryPath, true);

      let defaultBranch: string;
      try {
        defaultBranch = await detectDefaultBranchFromBare(bareRepositoryPath(repositoryPath));
      } catch {
        defaultBranch = remoteBranches.includes(DEFAULT_BRANCH)
          ? DEFAULT_BRANCH
          : (remoteBranches[0] ?? DEFAULT_BRANCH);
      }

      if (request !== requestRef.current) {
        return;
      }

      setWorktrees(
        buildWorktreeList({
          repositoryName,
          defaultBranch,
          worktrees: rawWorktrees,
        }),
      );
      setBranches(sortBranches(remoteBranches, defaultBranch));
      setLoadedRepositoryPath(repositoryPath);
    },
    [config.repositoryWorktreeSeparator, stateStore],
  );

  const invalidate = useCallback(() => {
    requestRef.current += 1;
    setLoadedRepositoryPath(null);
  }, []);

  const repository = activeRepository(screen);
  const repositoryName = repository?.name ?? '';
  const repositoryPath = repository?.path ?? '';

  useEffect(() => {
    if (!repositoryName || !repositoryPath) {
      return;
    }
    void load(repositoryName, repositoryPath, {
      refreshFromOrigin: screen.type === 'branches',
    });
  }, [load, repositoryName, repositoryPath, screen.type]);

  return {
    worktrees,
    branches,
    ready: repositoryPath !== '' && loadedRepositoryPath === repositoryPath,
    refreshingBranches,
    load,
    invalidate,
  };
}
