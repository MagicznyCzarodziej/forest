import type { ScreenState } from './navigation';
import type { StartContext } from '../../domain/repositories/detect-context';

export function initialStack(start: StartContext): ScreenState[] {
  if (start.screen === 'worktrees') {
    return [
      { type: 'repositories' },
      {
        type: 'worktrees',
        repositoryName: start.repositoryName,
        repositoryPath: start.repositoryPath,
      },
    ];
  }
  return [{ type: 'repositories' }];
}
