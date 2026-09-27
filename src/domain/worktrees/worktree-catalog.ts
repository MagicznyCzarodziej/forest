import type { WorktreeEntry } from '../types';

export function sortWorktrees(worktrees: WorktreeEntry[]): WorktreeEntry[] {
  return [...worktrees].sort((a, b) => {
    if (a.isDefaultBranch !== b.isDefaultBranch) {
      return a.isDefaultBranch ? -1 : 1;
    }
    const aUsed = a.lastUsedAt ?? -1;
    const bUsed = b.lastUsedAt ?? -1;
    return bUsed - aUsed;
  });
}

export interface RawWorktree {
  folderName: string;
  branch: string;
  path: string;
  lastUsedAt?: number;
}

export interface BuildWorktreeListInput {
  repositoryName: string;
  defaultBranch: string;
  worktrees: RawWorktree[];
}

export function buildWorktreeList(input: BuildWorktreeListInput): WorktreeEntry[] {
  const entries = input.worktrees.map((wt) => ({
    name: wt.folderName,
    path: wt.path,
    branch: wt.branch,
    isDefaultBranch: wt.branch === input.defaultBranch,
    lastUsedAt: wt.lastUsedAt,
  }));
  return sortWorktrees(entries);
}
