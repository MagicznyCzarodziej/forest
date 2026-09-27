import type { GitHubOwner } from './github-owner';

export type RepositoryStructure = 'standard' | 'legacy' | 'unknown' | 'none';

export interface ForestConfig {
  root: string;
  githubOwner: GitHubOwner;
  /** Between the repository name and branch name in a worktree folder, such as `repository__master`. */
  repositoryWorktreeSeparator: string;
}

export interface LocalRepositoryMeta {
  name: string;
  path: string;
  structure: Exclude<RepositoryStructure, 'none'>;
  lastOpenedAt?: number;
}

export interface RepositoryCatalogEntry {
  name: string;
  clonedLocally: boolean;
  structure: RepositoryStructure;
  path?: string;
  lastOpenedAt?: number;
}

export interface WorktreeEntry {
  name: string;
  path: string;
  branch: string;
  isDefaultBranch: boolean;
  lastUsedAt?: number;
}
