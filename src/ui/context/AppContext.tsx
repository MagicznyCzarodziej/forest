import { loadConfig, remoteRepositoryCachePath } from '../../config/load-config';
import { GitHubCliRepositoryListProvider } from '../../infrastructure/github/repository-list-provider';
import {
  cachedRemoteRepositoryNames,
  resolveRemoteRepositoryNames,
} from '../../infrastructure/github/remote-repository-cache';
import { buildRepositoryCatalog } from '../../domain/repositories/repository-catalog';
import type { StartContext } from '../../domain/repositories/detect-context';
import { resolveStartContext } from '../../domain/repositories/detect-context';
import { resolveRepositoryContextFromCurrentPath } from '../../domain/repositories/resolve-repository-context';
import { scanLocalRepositories } from '../../domain/repositories/scan-local-repositories';
import { RepositoryStateStore } from '../../domain/state/repository-state';
import type { ForestConfig, LocalRepositoryMeta, RepositoryCatalogEntry } from '../../domain/types';
import { createContext, PropsWithChildren } from 'react';

const defaultRepositoryListProvider = new GitHubCliRepositoryListProvider();

export interface AppContextValue {
  config: ForestConfig;
  repositories: RepositoryCatalogEntry[];
  localRepositories: LocalRepositoryMeta[];
  /** False when the GitHub list is missing or older than 30 days. */
  remoteListFresh: boolean;
  refreshRemoteRepositories: () => Promise<string[]>;
  startContext: StartContext;
  stateStore: RepositoryStateStore;
}

export async function createAppContext(startPath: string): Promise<AppContextValue> {
  const config = await loadConfig();
  const stateStore = new RepositoryStateStore(RepositoryStateStore.defaultPath());
  const localRepositories = await scanLocalRepositories(
    config.root,
    stateStore,
    config.repositoryWorktreeSeparator,
  );
  const cachePath = remoteRepositoryCachePath();
  const cached = await cachedRemoteRepositoryNames(cachePath, config.githubOwner);
  const repositories = buildRepositoryCatalog(cached.repositoryNames, localRepositories);
  const repositoryContext = await resolveRepositoryContextFromCurrentPath(startPath, config.root);
  const startContext = resolveStartContext(repositoryContext);

  return {
    config,
    repositories,
    localRepositories,
    remoteListFresh: cached.fresh,
    refreshRemoteRepositories: () =>
      resolveRemoteRepositoryNames({
        cachePath,
        owner: config.githubOwner,
        provider: defaultRepositoryListProvider,
      }),
    startContext,
    stateStore,
  };
}

export const AppContext = createContext<AppContextValue | null>(null);

interface AppContextProviderProps {
  context: AppContextValue;
}

export function AppContextProvider({
  context,
  children,
}: PropsWithChildren<AppContextProviderProps>) {
  return <AppContext value={context}>{children}</AppContext>;
}
