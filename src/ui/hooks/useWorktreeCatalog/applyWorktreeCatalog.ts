import type { RepositoryStateStore } from '../../../domain/state/repository-state';
import type { WorktreeEntry } from '../../../domain/types';
import { buildWorktreeList } from '../../../domain/worktrees/worktree-catalog';
import { listRemoteBranches, scanWorktrees } from '../../../domain/worktrees/scan-worktrees';
import {
  DEFAULT_BRANCH,
  detectDefaultBranchFromBare,
} from '../../../infrastructure/git/default-branch';
import { bareRepositoryPath } from '../../../domain/repositories/repository-structure';
import { sortBranches } from './sortBranches';

export interface WorktreeCatalogSnapshot {
  worktrees: WorktreeEntry[];
  branches: string[];
}

export async function readWorktreeCatalogFromDisk(input: {
  repositoryName: string;
  repositoryPath: string;
  repositoryWorktreeSeparator: string;
  stateStore: RepositoryStateStore;
}): Promise<WorktreeCatalogSnapshot> {
  const rawWorktrees = await scanWorktrees(
    input.repositoryPath,
    input.repositoryName,
    input.stateStore,
    input.repositoryWorktreeSeparator,
  );
  const remoteBranches = await listRemoteBranches(input.repositoryPath, true);

  let defaultBranch: string;
  try {
    defaultBranch = await detectDefaultBranchFromBare(bareRepositoryPath(input.repositoryPath));
  } catch {
    defaultBranch = remoteBranches.includes(DEFAULT_BRANCH)
      ? DEFAULT_BRANCH
      : (remoteBranches[0] ?? DEFAULT_BRANCH);
  }

  return {
    worktrees: buildWorktreeList({
      repositoryName: input.repositoryName,
      defaultBranch,
      worktrees: rawWorktrees,
    }),
    branches: sortBranches(remoteBranches, defaultBranch),
  };
}
