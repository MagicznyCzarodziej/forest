import { useForestNavigation } from '../context/ForestNavigationContext';
import { useRepositoryListContext } from '../context/RepositoryListContext';
import { useWorktreeCatalogContext } from '../context/WorktreeCatalogContext';
import type { ScreenState } from '../navigation/navigation';
import type { GitHubListStatus } from './useRepositoryList';

export function useScreenSubtitle(): string {
  const { screen } = useForestNavigation();
  const { githubListStatus } = useRepositoryListContext();
  const { ready: catalogReady, refreshingBranches } = useWorktreeCatalogContext();

  if (screen.type === 'repositories') {
    return repositoriesSubtitle(githubListStatus);
  }
  return screenSubtitle(screen, catalogReady, refreshingBranches);
}

function repositoriesSubtitle(githubListStatus: GitHubListStatus): string {
  if (githubListStatus === 'loading') {
    return 'Repositories · Loading from GitHub…';
  }
  if (githubListStatus === 'error') {
    return 'Repositories · Could not refresh list · type a name to clone';
  }
  return 'Repositories';
}

function screenSubtitle(
  screen: ScreenState,
  catalogReady: boolean,
  refreshingBranches: boolean,
): string {
  switch (screen.type) {
    case 'repositories':
      return repositoriesSubtitle('ready');
    case 'worktrees':
      return `${screen.repositoryName} · Worktrees`;
    case 'branches':
      if (!catalogReady || refreshingBranches) {
        return `${screen.repositoryName} · Fetching branches…`;
      }
      return `${screen.repositoryName} · Create ${screen.newBranchName} from a branch`;
    case 'confirm-clone':
      return 'Clone repository';
    case 'confirm-convert':
      return 'Convert folder to Forest structure';
    case 'progress':
      return screen.title;
    case 'message':
      return screen.title;
    default:
      return '';
  }
}
