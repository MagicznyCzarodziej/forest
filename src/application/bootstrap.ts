import { loadConfig, remoteRepoCachePath } from "../config/load-config.js";
import { GhCliRepoListProvider } from "../github/repo-list-provider.js";
import { cachedRemoteRepoNames, resolveRemoteRepoNames } from "../github/remote-repo-cache.js";
import { buildRepoCatalog } from "../repos/repo-catalog.js";
import { detectStartContext } from "../repos/detect-context.js";
import { resolveRepoContextFromCwd } from "../repos/resolve-repo-context.js";
import { scanLocalRepos } from "../repos/scan-local-repos.js";
import { RepoStateStore } from "../state/repo-state.js";
import type { LocalRepoMeta, RepoCatalogEntry } from "../domain/types.js";
import type { StartContext } from "../repos/detect-context.js";

const defaultRepoListProvider = new GhCliRepoListProvider();

export interface BootstrapResult {
  config: Awaited<ReturnType<typeof loadConfig>>;
  repos: RepoCatalogEntry[];
  localRepos: LocalRepoMeta[];
  /** False when the GitHub list is missing or older than 30 days. */
  remoteListFresh: boolean;
  refreshRemoteRepos: () => Promise<string[]>;
  startContext: StartContext;
  stateStore: RepoStateStore;
}

export async function bootstrap(cwd = process.cwd()): Promise<BootstrapResult> {
  const config = await loadConfig();
  const stateStore = new RepoStateStore(RepoStateStore.defaultPath());
  const localRepos = await scanLocalRepos(config.root, stateStore, config.repoSlugSeparator);
  const cachePath = remoteRepoCachePath();
  const cached = await cachedRemoteRepoNames(cachePath, config.githubOwner);
  const repos = buildRepoCatalog({ remoteRepoNames: cached.repoNames, localRepos });
  const repoContext = await resolveRepoContextFromCwd(cwd, config.root);
  const startContext = detectStartContext(cwd, config.root, repoContext);

  return {
    config,
    repos,
    localRepos,
    remoteListFresh: cached.fresh,
    refreshRemoteRepos: () =>
      resolveRemoteRepoNames({
        cachePath,
        owner: config.githubOwner,
        provider: defaultRepoListProvider,
      }),
    startContext,
    stateStore,
  };
}
