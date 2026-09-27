import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { convertLegacyRepository } from '../../src/git/convert-repository';
import { detectDefaultBranchFromBare } from '../../src/git/default-branch';

const execFileAsync = promisify(execFile);
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function git(args: string[], cwd?: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd });
    return stdout.replace(/\s+$/, '');
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    throw new Error(err.stderr || err.message || 'git failed', { cause: error });
  }
}

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(process.cwd(), '.tmp-convert-'));
  roots.push(root);
  return root;
}

async function initOrigin(origin: string): Promise<void> {
  await mkdir(origin, { recursive: true });
  await git(['init', '-b', 'master'], origin);
  await git(['config', 'user.email', 't@example.com'], origin);
  await git(['config', 'user.name', 'Test'], origin);
  await git(['config', 'commit.gpgsign', 'false'], origin);
  await writeFile(join(origin, 'README.md'), 'master-content\n');
  await git(['add', 'README.md'], origin);
  await git(['commit', '-m', 'master'], origin);
  await git(['checkout', '-b', 'feature/login'], origin);
  await writeFile(join(origin, 'feature.txt'), 'feature-content\n');
  await git(['add', 'feature.txt'], origin);
  await git(['commit', '-m', 'feature'], origin);
  await git(['checkout', 'master'], origin);
}

async function classicClone(origin: string, repositoryPath: string, branch: string): Promise<void> {
  await git(['clone', origin, repositoryPath]);
  if (branch !== 'master') {
    await git(['checkout', branch], repositoryPath);
  }
}

describe('convertLegacyRepository', () => {
  it('keeps a feature-branch checkout and also checks out master', async () => {
    const root = await tempRoot();
    const origin = join(root, 'origin');
    const repositoryPath = join(root, 'demo');
    await initOrigin(origin);
    await classicClone(origin, repositoryPath, 'feature/login');
    await writeFile(join(repositoryPath, 'feature.txt'), 'feature-content\ndirty\n');
    await writeFile(join(repositoryPath, 'staged.txt'), 'staged\n');
    await git(['add', 'staged.txt'], repositoryPath);
    await writeFile(join(repositoryPath, 'untracked.txt'), 'untracked\n');

    const logs: string[] = [];
    const result = await convertLegacyRepository({
      repositoryPath,
      repositoryName: 'demo',
      onOutput: (line) => logs.push(line),
    });

    expect(result).toEqual({ defaultBranch: 'master', currentBranch: 'feature/login' });
    expect(logs.some((line) => line.startsWith('fatal:'))).toBe(false);
    expect(await detectDefaultBranchFromBare(join(repositoryPath, '.bare'))).toBe('master');
    expect(await git(['remote', 'get-url', 'origin'], join(repositoryPath, '.bare'))).toBe(origin);

    const featureWt = join(repositoryPath, 'demo__feature-login');
    const masterWt = join(repositoryPath, 'demo__master');
    expect(await git(['symbolic-ref', '--short', 'HEAD'], featureWt)).toBe('feature/login');
    expect(await git(['symbolic-ref', '--short', 'HEAD'], masterWt)).toBe('master');
    expect(await readFile(join(featureWt, 'feature.txt'), 'utf8')).toBe('feature-content\ndirty\n');
    expect(await readFile(join(masterWt, 'README.md'), 'utf8')).toBe('master-content\n');
    const featureStatus = await git(['status', '--porcelain'], featureWt);
    expect(featureStatus).toContain(' M feature.txt');
    expect(featureStatus).toContain('A  staged.txt');
    expect(featureStatus).toContain('?? untracked.txt');
    expect(await git(['status', '--porcelain'], masterWt)).toBe('');
    expect(await readdir(repositoryPath)).toEqual(
      expect.arrayContaining(['.bare', 'demo__feature-login', 'demo__master']),
    );
  });

  it('checks out master when that is the branch already in use', async () => {
    const root = await tempRoot();
    const origin = join(root, 'origin');
    const repositoryPath = join(root, 'demo');
    await initOrigin(origin);
    await classicClone(origin, repositoryPath, 'master');
    await writeFile(join(repositoryPath, 'README.md'), 'master-content\ndirty\n');

    const logs: string[] = [];
    const result = await convertLegacyRepository({
      repositoryPath,
      repositoryName: 'demo',
      onOutput: (line) => logs.push(line),
    });

    expect(result).toEqual({ defaultBranch: 'master', currentBranch: 'master' });
    expect(logs.some((line) => line.includes("Preparing worktree (checking out 'master')"))).toBe(
      true,
    );
    expect(logs.some((line) => line.startsWith('fatal:'))).toBe(false);
    const masterWt = join(repositoryPath, 'demo__master');
    expect(await readFile(join(masterWt, 'README.md'), 'utf8')).toBe('master-content\ndirty\n');
    expect(await git(['status', '--porcelain'], masterWt)).toContain(' M README.md');
    expect(await readdir(repositoryPath)).toEqual(
      expect.arrayContaining(['.bare', 'demo__master']),
    );
    expect(await readdir(repositoryPath)).not.toContain('demo__feature-login');
  });

  it('finishes a conversion that died while checking out master', async () => {
    const root = await tempRoot();
    const origin = join(root, 'origin');
    const repositoryPath = join(root, 'demo');
    await initOrigin(origin);
    await classicClone(origin, repositoryPath, 'master');
    await writeFile(join(repositoryPath, 'README.md'), 'master-content\ndirty\n');
    await git(['clone', '--bare', '.', join(repositoryPath, '.bare')], repositoryPath);
    await rm(join(repositoryPath, '.git'), { recursive: true, force: true });
    const folder = join(repositoryPath, 'demo__master');
    await mkdir(folder);
    for (const entry of await readdir(repositoryPath)) {
      if (entry === '.bare' || entry === 'demo__master') {
        continue;
      }
      await rename(join(repositoryPath, entry), join(folder, entry));
    }

    const result = await convertLegacyRepository({
      repositoryPath,
      repositoryName: 'demo',
      originUrl: origin,
      onOutput: () => undefined,
    });

    expect(result).toEqual({ defaultBranch: 'master', currentBranch: 'master' });
    expect(await readFile(join(folder, 'README.md'), 'utf8')).toBe('master-content\ndirty\n');
    expect(await git(['status', '--porcelain'], folder)).toContain(' M README.md');
    expect(await git(['remote', 'get-url', 'origin'], join(repositoryPath, '.bare'))).toBe(origin);
    expect(await git(['symbolic-ref', '--short', 'HEAD'], folder)).toBe('master');
  });

  it('finishes a feature-branch conversion and still adds master', async () => {
    const root = await tempRoot();
    const origin = join(root, 'origin');
    const repositoryPath = join(root, 'demo');
    await initOrigin(origin);
    await classicClone(origin, repositoryPath, 'feature/login');
    await writeFile(join(repositoryPath, 'feature.txt'), 'feature-content\ndirty\n');
    await git(['clone', '--bare', '.', join(repositoryPath, '.bare')], repositoryPath);
    await rm(join(repositoryPath, '.git'), { recursive: true, force: true });
    const folder = join(repositoryPath, 'demo__feature-login');
    await mkdir(folder);
    for (const entry of await readdir(repositoryPath)) {
      if (entry === '.bare' || entry === 'demo__feature-login') {
        continue;
      }
      await rename(join(repositoryPath, entry), join(folder, entry));
    }

    const result = await convertLegacyRepository({
      repositoryPath,
      repositoryName: 'demo',
      originUrl: origin,
      onOutput: () => undefined,
    });

    expect(result).toEqual({ defaultBranch: 'master', currentBranch: 'feature/login' });
    expect(await readFile(join(folder, 'feature.txt'), 'utf8')).toBe('feature-content\ndirty\n');
    expect(await git(['symbolic-ref', '--short', 'HEAD'], folder)).toBe('feature/login');
    expect(
      await git(['symbolic-ref', '--short', 'HEAD'], join(repositoryPath, 'demo__master')),
    ).toBe('master');
    expect(await git(['remote', 'get-url', 'origin'], join(repositoryPath, '.bare'))).toBe(origin);
  });
});
