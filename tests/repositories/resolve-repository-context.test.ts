import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { resolveRepositoryContextFromCurrentPath } from '../../src/domain/repositories/resolve-repository-context';

describe('resolveRepositoryContextFromCurrentPath', () => {
  it('returns the repository container when cwd is the forest repository folder (not a worktree)', async () => {
    const root = await mkdir(join(tmpdir(), `forest-root-${Date.now()}`), { recursive: true });
    const repositoryPath = join(root, 'my-repository');
    await mkdir(join(repositoryPath, '.bare'), { recursive: true });
    await writeFile(join(repositoryPath, '.bare', 'HEAD'), 'ref: refs/heads/main\n');

    await expect(resolveRepositoryContextFromCurrentPath(repositoryPath, root)).resolves.toEqual({
      repositoryName: 'my-repository',
      repositoryPath,
    });
  });

  it('returns the repository container when cwd is inside a worktree checkout', async () => {
    const root = await mkdir(join(tmpdir(), `forest-root-${Date.now()}`), { recursive: true });
    const repositoryPath = join(root, 'my-repository');
    const worktreePath = join(repositoryPath, 'my-repository__main');
    await mkdir(join(repositoryPath, '.bare'), { recursive: true });
    await mkdir(worktreePath, { recursive: true });
    await writeFile(join(worktreePath, '.git'), 'gitdir: ../.bare/worktrees/main\n');

    const cwd = join(worktreePath, 'src', 'lib');
    await mkdir(cwd, { recursive: true });

    await expect(resolveRepositoryContextFromCurrentPath(cwd, root)).resolves.toEqual({
      repositoryName: 'my-repository',
      repositoryPath,
    });
  });

  it('returns null when cwd is under root but not in a forest repository', async () => {
    const root = await mkdir(join(tmpdir(), `forest-root-${Date.now()}`), { recursive: true });
    const other = join(root, 'notes');
    await mkdir(other, { recursive: true });

    await expect(resolveRepositoryContextFromCurrentPath(other, root)).resolves.toBeNull();
  });
});
