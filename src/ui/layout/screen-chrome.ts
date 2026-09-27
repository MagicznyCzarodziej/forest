import type { ScreenState } from '../navigation/screen-stack';
import { GitHubListStatus } from '../hooks/useRepositoryList';

export function repositoriesSubtitle(githubListStatus: GitHubListStatus): string {
  if (githubListStatus === 'loading') {
    return 'Repositories · Loading from GitHub…';
  }
  if (githubListStatus === 'error') {
    return 'Repositories · Could not load GitHub repositories';
  }
  return 'Repositories';
}

export function screenSubtitle(screen: ScreenState): string {
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

export function screenFooter(screen: ScreenState): string | undefined {
  if (screen.type === 'confirm-clone' || screen.type === 'confirm-convert') {
    return '←→ choose · Y/N · Enter confirm · Esc cancel';
  }
  if (screen.type === 'progress') {
    return 'Working…';
  }
  return undefined;
}
