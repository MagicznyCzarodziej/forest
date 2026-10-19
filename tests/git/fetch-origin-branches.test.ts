import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { listRemoteBranches } from '../../src/domain/worktrees/scan-worktrees';
import { cloneRepository } from '../../src/infrastructure/git/clone-repository';
import { fetchOriginBranches } from '../../src/infrastructure/git/fetch-origin';

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
  const root = await mkdtemp(join(process.cwd(), '.tmp-fetch-origin-branches-'));
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

describe('fetchOriginBranches', () => {
  it('lists a branch that was pushed to origin after the forest clone', async () => {
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

    const featurePath = join(root, 'feature');
    await git(['clone', originPath, featurePath]);
    await git(['checkout', '-b', 'feature/remote-only'], featurePath);
    await writeFile(join(featurePath, 'feature.txt'), 'feature\n');
    await git(['add', 'feature.txt'], featurePath);
    await git(['commit', '-m', 'Add feature branch'], featurePath);
    await git(['push', '-u', 'origin', 'feature/remote-only'], featurePath);

    const beforeFetch = await listRemoteBranches(repository.repositoryDir, true);
    expect(beforeFetch).not.toContain('feature/remote-only');

    await fetchOriginBranches(repository.barePath);

    const afterFetch = await listRemoteBranches(repository.repositoryDir, true);
    expect(afterFetch).toContain('feature/remote-only');
  });
});
