export interface RepositoryContext {
  repositoryName: string;
  repositoryPath: string;
}

export type StartContext =
  | { screen: 'repositories' }
  | {
      screen: 'worktrees';
      repositoryName: string;
      repositoryPath: string;
    };

export function resolveStartContext(repositoryContext: RepositoryContext | null): StartContext {
  return repositoryContext
    ? {
        screen: 'worktrees',
        repositoryName: repositoryContext.repositoryName,
        repositoryPath: repositoryContext.repositoryPath,
      }
    : { screen: 'repositories' };
}
