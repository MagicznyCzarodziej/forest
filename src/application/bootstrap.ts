import { loadConfig, remoteRepoCachePath } from "../config/load-config.js";
import { GhCliRepoListProvider } from "../github/repo-list-provider.js";
import { resolveRemoteRepoNames } from "../github/remote-repo-cache.js";
import { buildRepoCatalog } from "../repos/repo-catalog.js";
import { detectStartContext } from "../repos/detect-context.js";
import { resolveRepoContextFromCwd } from "../repos/resolve-repo-context.js";
import { scanLocalRepos } from "../repos/scan-local-repos.js";
import { RepoStateStore } from "../state/repo-state.js";
import type { RepoCatalogEntry } from "../domain/types.js";
import type { StartContext } from "../repos/detect-context.js";

const defaultRepoListProvider = new GhCliRepoListProvider();

export interface BootstrapResult {
  config: Awaited<ReturnType<typeof loadConfig>>;
  repos: RepoCatalogEntry[];
  startContext: StartContext;
  stateStore: RepoStateStore;
}

export async function bootstrap(cwd = process.cwd()): Promise<BootstrapResult> {
  const config = await loadConfig();
  const stateStore = new RepoStateStore(RepoStateStore.defaultPath());
  const localRepos = await scanLocalRepos(config.root, stateStore);
  const remoteRepoNames = await resolveRemoteRepoNames({
    cachePath: remoteRepoCachePath(),
    owner: config.githubOwner,
    provider: defaultRepoListProvider,
  });
  const repos = buildRepoCatalog({ remoteRepoNames, localRepos });
  const repoContext = await resolveRepoContextFromCwd(cwd, config.root);
  const startContext = detectStartContext(cwd, config.root, repoContext);

  return { config, repos, startContext, stateStore };
}
