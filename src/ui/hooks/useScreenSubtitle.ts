import { useForestNavigation } from '../context/ForestNavigationContext';
import { useForestOperationsContext } from '../context/ForestOperationsContext';
import type { ScreenState } from '../navigation/navigation';
import { GitHubListStatus } from './useRepositoryList';

export function useScreenSubtitle(): string {
  const { screen } = useForestNavigation();
  const { githubListStatus } = useForestOperationsContext();

  if (screen.type === 'repositories') {
    return repositoriesSubtitle(githubListStatus);
  }
  return screenSubtitle(screen);
}

function repositoriesSubtitle(githubListStatus: GitHubListStatus): string {
  if (githubListStatus === 'loading') {
    return 'Repositories · Loading from GitHub…';
  }
  if (githubListStatus === 'error') {
    return 'Repositories · Could not load GitHub repositories';
  }
  return 'Repositories';
}

function screenSubtitle(screen: ScreenState): string {
  switch (screen.type) {
    case 'repositories':
      return repositoriesSubtitle('ready');
    case 'worktrees':
      return `${screen.repositoryName} · Worktrees`;
    case 'branches':
      return `${screen.repositoryName} · Create ${screen.newBranchName} from a branch`;
    case 'confirm-clone':
      return 'Clone repository';
    case 'confirm-convert':
      return 'Convert folder to Forest structure';
    case 'progress':
      return screen.title;
    default:
      return '';
  }
}
