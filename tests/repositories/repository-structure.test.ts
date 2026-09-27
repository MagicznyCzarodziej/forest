import { describe, expect, it } from 'vitest';
import {
  detectRepositoryStructure,
  worktreeFolderName,
  bareRepositoryPath,
  defaultWorktreePath,
} from '../../src/repositories/repository-structure';

describe('worktreeFolderName', () => {
  it('joins repository name and worktree slug with double underscore', () => {
    expect(worktreeFolderName('forest', 'master')).toBe('forest__master');
    expect(worktreeFolderName('forest', 'feature-login')).toBe('forest__feature-login');
    expect(worktreeFolderName('forest', 'master', '--')).toBe('forest--master');
  });
});

describe('bareRepositoryPath', () => {
  it('points to .bare inside repository folder', () => {
    expect(bareRepositoryPath('/dev/forest')).toBe('/dev/forest/.bare');
  });
});

describe('defaultWorktreePath', () => {
  it('uses default branch in folder name', () => {
    expect(defaultWorktreePath('/dev/forest', 'forest', 'master')).toBe(
      '/dev/forest/forest__master',
    );
  });
});

describe('detectRepositoryStructure', () => {
  it('returns standard when .bare exists and layout matches', () => {
    expect(
      detectRepositoryStructure({
        repositoryPath: '/dev/forest',
        repositoryName: 'forest',
        hasBareDir: true,
        childDirNames: ['forest__master', '.bare'],
        defaultBranch: 'master',
      }),
    ).toBe('standard');
  });

  it('returns legacy when .git exists at root without .bare', () => {
    expect(
      detectRepositoryStructure({
        repositoryPath: '/dev/forest',
        repositoryName: 'forest',
        hasBareDir: false,
        hasRootGit: true,
        childDirNames: ['src'],
        defaultBranch: 'master',
      }),
    ).toBe('legacy');
  });

  it('returns legacy when .bare exists but no worktree checkout was registered', () => {
    expect(
      detectRepositoryStructure({
        repositoryPath: '/dev/forest',
        repositoryName: 'forest',
        hasBareDir: true,
        hasRootGit: false,
        hasWorktreeCheckout: false,
        childDirNames: ['forest__master', '.bare'],
        defaultBranch: 'master',
      }),
    ).toBe('legacy');
  });

  it('returns unknown when folder exists but is not a git repository', () => {
    expect(
      detectRepositoryStructure({
        repositoryPath: '/dev/forest',
        repositoryName: 'forest',
        hasBareDir: false,
        hasRootGit: false,
        childDirNames: [],
        defaultBranch: 'master',
      }),
    ).toBe('unknown');
  });
});
