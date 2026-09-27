import { describe, expect, it } from 'vitest';
import { sortWorktrees, buildWorktreeList } from '../../src/domain/worktrees/worktree-catalog';

describe('sortWorktrees', () => {
  it('puts default branch worktree first', () => {
    const sorted = sortWorktrees([
      { name: 'feature', path: '/p/f', branch: 'feature', isDefaultBranch: false, lastUsedAt: 999 },
      { name: 'master', path: '/p/m', branch: 'master', isDefaultBranch: true, lastUsedAt: 1 },
    ]);
    expect(sorted[0]?.branch).toBe('master');
  });

  it('sorts non-default by lastUsedAt descending', () => {
    const sorted = sortWorktrees([
      { name: 'a', path: '/p/a', branch: 'a', isDefaultBranch: false, lastUsedAt: 10 },
      { name: 'b', path: '/p/b', branch: 'b', isDefaultBranch: false, lastUsedAt: 50 },
      { name: 'master', path: '/p/m', branch: 'master', isDefaultBranch: true },
    ]);
    expect(sorted.map((w) => w.branch)).toEqual(['master', 'b', 'a']);
  });
});

describe('buildWorktreeList', () => {
  it('maps discovered worktrees with default branch flag', () => {
    const list = buildWorktreeList({
      repositoryName: 'forest',
      defaultBranch: 'master',
      worktrees: [
        {
          folderName: 'forest__master',
          branch: 'master',
          path: '/dev/forest/forest__master',
          lastUsedAt: 1,
        },
        {
          folderName: 'forest__feat',
          branch: 'feat',
          path: '/dev/forest/forest__feat',
          lastUsedAt: 2,
        },
      ],
    });
    expect(list.find((w) => w.branch === 'master')?.isDefaultBranch).toBe(true);
    expect(list.find((w) => w.branch === 'feat')?.isDefaultBranch).toBe(false);
  });
});
