import { isPathInside } from '../utils/paths.js';

export interface RepoContext {
  repoName: string;
  repoPath: string;
}

export type StartContext =
  { screen: 'repos' } | { screen: 'worktrees'; repoName: string; repoPath: string };

export function detectStartContext(
  cwd: string,
  root: string,
  repoContext: RepoContext | null,
): StartContext {
  if (
    repoContext &&
    isPathInside(repoContext.repoPath, cwd) &&
    isPathInside(root, repoContext.repoPath)
  ) {
    return {
      screen: 'worktrees',
      repoName: repoContext.repoName,
      repoPath: repoContext.repoPath,
    };
  }
  return { screen: 'repos' };
}
