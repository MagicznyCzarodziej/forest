import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { cloneRepository } from '../../src/infrastructure/git/clone-repository';
import { createWorktreeFromBare } from '../../src/infrastructure/git/create-worktree';

const execFileAsync = promisify(execFile);
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function git(args: string[], cwd?: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(process.cwd(), '.tmp-worktree-origin-'));
  roots.push(root);
  return root;
}

async function initOrigin(root: string): Promise<string> {
  const originPath = join(root, 'origin.git');
  const seedPath = join(root, 'seed');
  await git(['init', '--bare', '-b', 'master', originPath]);
  await git(['init', '-b', 'master', seedPath]);
  await git(['config', 'user.email', 'test@example.com'], seedPath);
  await git(['config', 'user.name', 'Test'], seedPath);
  await git(['config', 'commit.gpgsign', 'false'], seedPath);
  await writeFile(join(seedPath, 'README.md'), 'test\n');
  await git(['add', 'README.md'], seedPath);
  await git(['commit', '-m', 'Initial commit'], seedPath);
  await git(['remote', 'add', 'origin', originPath], seedPath);
  await git(['push', '-u', 'origin', 'master'], seedPath);
  return originPath;
}

describe('worktree origin', () => {
  it('points the default worktree at the upstream repository', async () => {
    const root = await tempRoot();
    const originPath = await initOrigin(root);
    const forestRoot = join(root, 'forest');
    await mkdir(forestRoot);

    const result = await cloneRepository({
      root: forestRoot,
      repositoryName: 'demo',
      cloneUrl: originPath,
      onOutput: () => undefined,
    });

    expect(await git(['remote', 'get-url', 'origin'], result.defaultWorktreePath)).toBe(originPath);
  });

  it('points a new worktree at the upstream repository and pushes there', async () => {
    const root = await tempRoot();
    const originPath = await initOrigin(root);
    const forestRoot = join(root, 'forest');
    await mkdir(forestRoot);
    const repository = await cloneRepository({
      root: forestRoot,
      repositoryName: 'demo',
      cloneUrl: originPath,
      onOutput: () => undefined,
    });

    const result = await createWorktreeFromBare({
      repositoryPath: repository.repositoryDir,
      repositoryName: 'demo',
      newBranchName: 'feature/new-worktree',
      baseBranch: 'master',
      onOutput: () => undefined,
    });

    expect(await git(['remote', 'get-url', 'origin'], result.worktreePath)).toBe(originPath);
    await git(['push', '--set-upstream', 'origin', result.branch], result.worktreePath);
    expect(
      await git(['show-ref', '--verify', '--hash', `refs/heads/${result.branch}`], originPath),
    ).not.toBe('');
  });

  it('refuses to create a worktree when the bare repository has no origin', async () => {
    const root = await tempRoot();
    const repositoryPath = join(root, 'demo');
    await git(['init', '--bare', '-b', 'master', join(repositoryPath, '.bare')]);

    await expect(
      createWorktreeFromBare({
        repositoryPath,
        repositoryName: 'demo',
        newBranchName: 'feature/no-origin',
        baseBranch: 'master',
        onOutput: () => undefined,
      }),
    ).rejects.toThrow('Bare repository has no origin remote');
  });
});
