import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorktreeEntry } from '../../../domain/types';
import type { ScreenState } from '../../navigation/navigation';
import { bareRepositoryPath } from '../../../domain/repositories/repository-structure';
import { fetchOriginBranches } from '../../../infrastructure/git/fetch-origin';
import { useForest } from '../useForest';
import { readWorktreeCatalogFromDisk } from './applyWorktreeCatalog';

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
  const loadedRepositoryPathRef = useRef<string | null>(null);

  useEffect(() => {
    loadedRepositoryPathRef.current = loadedRepositoryPath;
  }, [loadedRepositoryPath]);

  const applyCatalog = useCallback(
    async (request: number, repositoryName: string, repositoryPath: string): Promise<boolean> => {
      if (request !== requestRef.current) {
        return false;
      }

      const snapshot = await readWorktreeCatalogFromDisk({
        repositoryName,
        repositoryPath,
        repositoryWorktreeSeparator: config.repositoryWorktreeSeparator,
        stateStore,
      });

      if (request !== requestRef.current) {
        return false;
      }

      setWorktrees(snapshot.worktrees);
      setBranches(snapshot.branches);
      setLoadedRepositoryPath(repositoryPath);
      loadedRepositoryPathRef.current = repositoryPath;
      return true;
    },
    [config.repositoryWorktreeSeparator, stateStore],
  );

  const load = useCallback(
    async (
      repositoryName: string,
      repositoryPath: string,
      options: LoadWorktreeCatalogOptions = {},
    ) => {
      const request = ++requestRef.current;

      if (!options.refreshFromOrigin) {
        setRefreshingBranches(false);
      }

      if (options.refreshFromOrigin) {
        if (loadedRepositoryPathRef.current !== repositoryPath) {
          const loaded = await applyCatalog(request, repositoryName, repositoryPath);
          if (!loaded) {
            return;
          }
        }

        if (request !== requestRef.current) {
          return;
        }

        setRefreshingBranches(true);
        void (async () => {
          try {
            await fetchOriginBranches(bareRepositoryPath(repositoryPath));
          } catch {
            // Offline or auth errors: fall back to refs already on disk.
          }
          if (request !== requestRef.current) {
            return;
          }
          await applyCatalog(request, repositoryName, repositoryPath);
          if (request === requestRef.current) {
            setRefreshingBranches(false);
          }
        })();
        return;
      }

      await applyCatalog(request, repositoryName, repositoryPath);
    },
    [applyCatalog],
  );

  const invalidate = useCallback(() => {
    requestRef.current += 1;
    loadedRepositoryPathRef.current = null;
    setLoadedRepositoryPath(null);
    setRefreshingBranches(false);
  }, []);

  const repository = activeRepository(screen);
  const repositoryName = repository?.name ?? '';
  const repositoryPath = repository?.path ?? '';

  useEffect(() => {
    if (!repositoryName || !repositoryPath) {
      return;
    }
    // Catalog load updates React state after reading git; screen changes must trigger reload.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load awaits git before setState
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
