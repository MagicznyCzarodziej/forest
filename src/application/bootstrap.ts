import { loadConfig, remoteRepositoryCachePath } from '../config/load-config';
import { GitHubCliRepositoryListProvider } from '../github/repository-list-provider';
import {
  cachedRemoteRepositoryNames,
  resolveRemoteRepositoryNames,
} from '../github/remote-repository-cache';
import { buildRepositoryCatalog } from '../repositories/repository-catalog';
import { resolveStartContext } from '../repositories/detect-context';
import { resolveRepositoryContextFromCurrentPath } from '../repositories/resolve-repository-context';
import { scanLocalRepositories } from '../repositories/scan-local-repositories';
import { RepositoryStateStore } from '../state/repository-state';
import type { ForestConfig, LocalRepositoryMeta, RepositoryCatalogEntry } from '../domain/types';
import type { StartContext } from '../repositories/detect-context';

const defaultRepositoryListProvider = new GitHubCliRepositoryListProvider();

export interface BootstrapResult {
  config: ForestConfig;
  repositories: RepositoryCatalogEntry[];
  localRepositories: LocalRepositoryMeta[];
  /** False when the GitHub list is missing or older than 30 days. */
  remoteListFresh: boolean;
  refreshRemoteRepositories: () => Promise<string[]>;
  startContext: StartContext;
  stateStore: RepositoryStateStore;
}

export async function bootstrap(startPath: string): Promise<BootstrapResult> {
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
