import { useCallback, useEffect, useRef, useState } from 'react';
import { sortBranches } from '../branch-picker';
import type { WorktreeEntry } from '../../domain/types';
import {
  DEFAULT_BRANCH,
  detectDefaultBranchFromBare,
} from '../../infrastructure/git/default-branch';
import type { ScreenState } from '../navigation/screen-stack';
import { bareRepositoryPath } from '../../domain/repositories/repository-structure';
import { buildWorktreeList } from '../../domain/worktrees/worktree-catalog';
import { listRemoteBranches, scanWorktrees } from '../../domain/worktrees/scan-worktrees';
import { useForest } from './useForest';

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
  const requestRef = useRef(0);

  const load = useCallback(
    async (repositoryName: string, repositoryPath: string) => {
      const request = ++requestRef.current;
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
    void load(repositoryName, repositoryPath);
  }, [load, repositoryName, repositoryPath]);

  return {
    worktrees,
    branches,
    ready: repositoryPath !== '' && loadedRepositoryPath === repositoryPath,
    load,
    invalidate,
  };
}
