import { join } from 'node:path';
import type { RepositoryStructure } from '../domain/types';
import { branchToWorktreeSlug } from '../git/branchToPath';

export const DEFAULT_REPOSITORY_WORKTREE_SEPARATOR = '__';

export function worktreeFolderName(
  repositoryName: string,
  branchOrSlug: string,
  separator = DEFAULT_REPOSITORY_WORKTREE_SEPARATOR,
): string {
  const slug = branchOrSlug.includes('/') ? branchToWorktreeSlug(branchOrSlug) : branchOrSlug;
  return `${repositoryName}${separator}${slug}`;
}

export function bareRepositoryPath(repositoryPath: string): string {
  return join(repositoryPath, '.bare');
}

export function defaultWorktreePath(
  repositoryPath: string,
  repositoryName: string,
  defaultBranch: string,
  separator = DEFAULT_REPOSITORY_WORKTREE_SEPARATOR,
): string {
  return join(repositoryPath, worktreeFolderName(repositoryName, defaultBranch, separator));
}

export interface DetectRepositoryStructureInput {
  repositoryPath: string;
  repositoryName: string;
  hasBareDir: boolean;
  hasRootGit?: boolean;
  childDirNames: string[];
  defaultBranch: string;
  repositoryWorktreeSeparator?: string;
  /** False when `.bare` exists but no child checkout has a `.git` file yet. */
  hasWorktreeCheckout?: boolean;
}

export function detectRepositoryStructure(
  input: DetectRepositoryStructureInput,
): RepositoryStructure {
  if (input.hasBareDir && input.hasWorktreeCheckout === false && !input.hasRootGit) {
    return 'legacy';
  }
  const expectedDefault = worktreeFolderName(
    input.repositoryName,
    input.defaultBranch,
    input.repositoryWorktreeSeparator,
  );
  if (input.hasBareDir && input.childDirNames.includes(expectedDefault)) {
    return 'standard';
  }
  if (input.hasRootGit && !input.hasBareDir) {
    return 'legacy';
  }
  if (input.hasBareDir) {
    return 'standard';
  }
  return 'unknown';
}
