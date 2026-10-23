import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { runCloneCommand } from '../../src/application/runCloneCommand';
import {
  bareRepositoryPath,
  defaultWorktreePath,
} from '../../src/domain/repositories/repository-structure';

const execFileAsync = promisify(execFile);
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function git(args: string[], cwd?: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}

async function tempRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(join(process.cwd(), prefix));
  roots.push(root);
  return root;
}

async function initOrigin(root: string): Promise<string> {
  const originPath = join(root, 'origin.git');
  const seedPath = join(root, 'seed');
  await git(['init', '--bare', '-b', 'main', originPath]);
  await git(['init', '-b', 'main', seedPath]);
  await git(['config', 'user.email', 'test@example.com'], seedPath);
  await git(['config', 'user.name', 'Test'], seedPath);
  await git(['config', 'commit.gpgsign', 'false'], seedPath);
  await writeFile(join(seedPath, 'README.md'), 'test\n');
  await git(['add', 'README.md'], seedPath);
  await git(['commit', '-m', 'Initial commit'], seedPath);
  await git(['remote', 'add', 'origin', originPath], seedPath);
  await git(['push', '-u', 'origin', 'main'], seedPath);
  return originPath;
}

async function writeForestConfig(home: string, forestRoot: string): Promise<void> {
  const configDir = join(home, '.config', 'forest');
  await mkdir(configDir, { recursive: true });
  await writeFile(
    join(configDir, 'config.json'),
    JSON.stringify({
      root: forestRoot,
      githubOwner: { kind: 'user', login: 'octocat' },
    }),
    'utf8',
  );
}

describe('runCloneCommand', () => {
  it('creates the same layout as the GUI clone flow', async () => {
    const root = await tempRoot('.tmp-run-clone-');
    const home = join(root, 'home');
    const forestRoot = join(root, 'dev');
    await mkdir(forestRoot);
    await writeForestConfig(home, forestRoot);

    const originPath = await initOrigin(root);
    const previousHome = process.env.HOME;
    process.env.HOME = home;

    try {
      const stdout: string[] = [];
      const stderr: string[] = [];
      const log = console.log;
      const error = console.error;
      console.log = (line?: unknown) => {
        stdout.push(String(line));
      };
      console.error = (line?: unknown) => {
        stderr.push(String(line));
      };

      try {
        await runCloneCommand('demo', { cloneUrl: originPath, home });
      } finally {
        console.log = log;
        console.error = error;
      }

      const repositoryDir = join(forestRoot, 'demo');
      const barePath = bareRepositoryPath(repositoryDir);
      const worktreePath = defaultWorktreePath(repositoryDir, 'demo', 'main');
      expect(stdout.at(-1)).toBe(worktreePath);
      expect(await git(['rev-parse', '--is-bare-repository'], barePath)).toBe('true');
      expect(await git(['remote', 'get-url', 'origin'], worktreePath)).toBe(originPath);

      const state = JSON.parse(
        await readFile(join(home, '.config', 'forest', 'state.json'), 'utf8'),
      ) as { repositories: Record<string, { lastOpenedAt?: number }> };
      expect(state.repositories.demo?.lastOpenedAt).toBeTypeOf('number');
    } finally {
      process.env.HOME = previousHome;
    }
  });

  it('refuses when the bare repository already exists', async () => {
    const root = await tempRoot('.tmp-run-clone-dup-');
    const home = join(root, 'home');
    const forestRoot = join(root, 'dev');
    const repositoryDir = join(forestRoot, 'demo');
    await mkdir(bareRepositoryPath(repositoryDir), { recursive: true });
    await writeForestConfig(home, forestRoot);

    const previousHome = process.env.HOME;
    process.env.HOME = home;

    try {
      await runCloneCommand('demo', { home });
      expect(process.exitCode).toBe(1);
    } finally {
      process.env.HOME = previousHome;
      process.exitCode = 0;
    }
  });
});
