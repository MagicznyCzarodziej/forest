import { execFile } from 'node:child_process';
import { lstat, mkdir, readFile, readdir, realpath, rename, rm, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { bareRepoPath, worktreeFolderName } from '../repos/repo-structure';
import {
  detectCurrentBranch,
  detectDefaultBranchFromCheckout,
  detectDefaultBranchFromRemote,
  repositoryHasCommits,
  type GitOutputHandler,
} from './default-branch';
import { runGitStreaming } from './run-git';

const execFileAsync = promisify(execFile);

const PER_WORKTREE_FILES = [
  'index',
  'ORIG_HEAD',
  'FETCH_HEAD',
  'MERGE_HEAD',
  'MERGE_MODE',
  'MERGE_MSG',
  'CHERRY_PICK_HEAD',
  'REVERT_HEAD',
  'REBASE_HEAD',
  'AUTO_MERGE',
];

const PER_WORKTREE_DIRS = ['sequencer', 'rebase-merge', 'rebase-apply'];

async function moveRootIntoWorktree(
  repoPath: string,
  worktreePath: string,
  reserved: Set<string>,
  onOutput: GitOutputHandler,
): Promise<void> {
  await mkdir(worktreePath, { recursive: true });
  const entries = await readdir(repoPath);
  for (const entry of entries) {
    if (reserved.has(entry)) {
      continue;
    }
    onOutput(`Moving ${entry} → worktree`);
    await rename(join(repoPath, entry), join(worktreePath, entry));
  }
}

export interface ConvertRepositoryResult {
  defaultBranch: string;
  currentBranch: string;
}

export async function convertLegacyRepository(input: {
  repoPath: string;
  repoName: string;
  repoSlugSeparator?: string;
  /** Used when a failed conversion already replaced origin with this repo path. */
  originUrl?: string;
  onOutput: GitOutputHandler;
}): Promise<ConvertRepositoryResult> {
  const barePath = bareRepoPath(input.repoPath);
  const rootGit = join(input.repoPath, '.git');
  const rootGitStat = await lstatOrNull(rootGit);

  if (rootGitStat?.isDirectory()) {
    return convertMainCheckout(input, barePath, rootGit);
  }
  if (rootGitStat) {
    throw new Error('Cannot convert a linked worktree');
  }
  if (await isDirectory(barePath)) {
    return resumeBareConversion(input, barePath);
  }
  throw new Error(`No git repository at ${input.repoPath}`);
}

async function convertMainCheckout(
  input: {
    repoPath: string;
    repoName: string;
    repoSlugSeparator?: string;
    originUrl?: string;
    onOutput: GitOutputHandler;
  },
  barePath: string,
  rootGit: string,
): Promise<ConvertRepositoryResult> {
  const currentBranch = await detectCurrentBranch(input.repoPath);
  if (!(await repositoryHasCommits(input.repoPath))) {
    return convertUnbornRepository(input, currentBranch);
  }

  const preferredDefault = await detectDefaultBranchFromCheckout(input.repoPath);
  input.onOutput(`Creating bare repository at ${barePath}`);
  await rename(rootGit, barePath);

  return finishConversion({
    ...input,
    barePath,
    currentBranch,
    preferredDefault,
    moveRootFiles: true,
  });
}

/** A previous attempt cloned `.bare` and moved the working tree, then `worktree add` failed. */
async function resumeBareConversion(
  input: {
    repoPath: string;
    repoName: string;
    repoSlugSeparator?: string;
    originUrl?: string;
    onOutput: GitOutputHandler;
  },
  barePath: string,
): Promise<ConvertRepositoryResult> {
  const currentBranch = await detectCurrentBranch(barePath);
  let preferredDefault = currentBranch;
  if (input.originUrl) {
    try {
      preferredDefault = await detectDefaultBranchFromRemote(input.originUrl);
    } catch {
      // Keep the checked-out branch when the remote default cannot be read.
    }
  }
  input.onOutput(`Resuming conversion of ${currentBranch}`);
  return finishConversion({
    ...input,
    barePath,
    currentBranch,
    preferredDefault,
    moveRootFiles: false,
  });
}

async function finishConversion(input: {
  repoPath: string;
  repoName: string;
  repoSlugSeparator?: string;
  originUrl?: string;
  onOutput: GitOutputHandler;
  barePath: string;
  currentBranch: string;
  preferredDefault: string;
  moveRootFiles: boolean;
}): Promise<ConvertRepositoryResult> {
  await configureBare(input.barePath);
  await repairOrigin(input.barePath, input.repoPath, input.originUrl, input.onOutput);
  const defaultBranch = await resolveDefaultBranch(
    input.barePath,
    input.preferredDefault,
    input.currentBranch,
    input.onOutput,
  );

  const currentFolder = worktreeFolderName(
    input.repoName,
    input.currentBranch,
    input.repoSlugSeparator,
  );
  const currentWt = join(input.repoPath, currentFolder);
  const alreadyRegistered = await pathExists(join(currentWt, '.git'));
  await registerCurrentWorktree(input.barePath, currentWt, input.currentBranch, input.onOutput);
  if (input.moveRootFiles) {
    await moveRootIntoWorktree(
      input.repoPath,
      currentWt,
      new Set(['.bare', currentFolder]),
      input.onOutput,
    );
  }
  const hadIndex = await pathExists(join(input.barePath, 'index'));
  await movePerWorktreeState(input.barePath, currentWt);
  if (!hadIndex && !alreadyRegistered) {
    // `worktree add --no-checkout` leaves an empty index, so every tracked file
    // looks deleted. Load HEAD into the index and keep the files on disk.
    await runGitStreaming(['reset', '--quiet'], {
      cwd: currentWt,
      onOutput: input.onOutput,
    });
  }

  if (defaultBranch !== input.currentBranch) {
    const defaultFolder = worktreeFolderName(
      input.repoName,
      defaultBranch,
      input.repoSlugSeparator,
    );
    const defaultWt = join(input.repoPath, defaultFolder);
    if (!(await pathExists(defaultWt))) {
      input.onOutput(`Checking out ${defaultBranch} into ${defaultWt}`);
      await runGitStreaming(['-C', input.barePath, 'worktree', 'add', defaultWt, defaultBranch], {
        onOutput: input.onOutput,
      });
    } else if (!(await pathExists(join(defaultWt, '.git')))) {
      throw new Error(
        `Cannot check out ${defaultBranch}: ${defaultWt} already exists and is not a worktree`,
      );
    }
  }

  await runGitStreaming(
    ['-C', input.barePath, 'symbolic-ref', 'HEAD', `refs/heads/${defaultBranch}`],
    { onOutput: input.onOutput },
  );
  return { defaultBranch, currentBranch: input.currentBranch };
}

/**
 * `git worktree add` prints "Preparing worktree (checking out '…')" and then
 * refuses a directory that already contains the working tree.
 * Register an empty folder first; move an existing checkout aside when retrying.
 */
async function registerCurrentWorktree(
  barePath: string,
  worktreePath: string,
  branch: string,
  onOutput: GitOutputHandler,
): Promise<void> {
  if (await pathExists(join(worktreePath, '.git'))) {
    return;
  }

  let stash: string | null = null;
  if (await pathExists(worktreePath)) {
    stash = `${worktreePath}.converting`;
    onOutput(`Setting aside ${worktreePath} to register the worktree`);
    await rename(worktreePath, stash);
  }

  onOutput(`Registering worktree for ${branch}`);
  await runGitStreaming(
    ['-C', barePath, 'worktree', 'add', '--no-checkout', '--force', worktreePath, branch],
    { onOutput },
  );

  if (stash) {
    await moveRootIntoWorktree(stash, worktreePath, new Set(['.git']), onOutput);
    await rm(stash, { recursive: true, force: true });
  }
}

async function configureBare(barePath: string): Promise<void> {
  await runGitStreaming(['-C', barePath, 'config', 'core.bare', 'true']);
  try {
    await execFileAsync('git', ['-C', barePath, 'config', '--unset-all', 'core.worktree']);
  } catch {
    // A normal clone does not set core.worktree.
  }
}

async function repairOrigin(
  barePath: string,
  repoPath: string,
  originUrl: string | undefined,
  onOutput: GitOutputHandler,
): Promise<void> {
  if (!originUrl) {
    return;
  }
  let current: string | null;
  try {
    const { stdout } = await execFileAsync('git', ['-C', barePath, 'remote', 'get-url', 'origin']);
    current = stdout.trim();
  } catch {
    current = null;
  }
  if (current && !(await originPointsAtRepo(current, repoPath))) {
    return;
  }
  onOutput(`Restoring origin to ${originUrl}`);
  if (current) {
    await runGitStreaming(['-C', barePath, 'remote', 'set-url', 'origin', originUrl], {
      onOutput,
    });
  } else {
    await runGitStreaming(['-C', barePath, 'remote', 'add', 'origin', originUrl], { onOutput });
  }
}

async function originPointsAtRepo(originUrl: string, repoPath: string): Promise<boolean> {
  const trimmed = originUrl.trim();
  if (trimmed === '.' || trimmed === './' || trimmed === './.') {
    return true;
  }
  let originPath = trimmed;
  if (trimmed.includes('://') || /^[^/:]+:/.test(trimmed)) {
    if (!trimmed.startsWith('file://')) {
      return false;
    }
    originPath = trimmed.slice('file://'.length);
  }
  try {
    const originReal = await realpath(resolve(repoPath, originPath));
    const repoReal = await realpath(repoPath);
    return originReal === repoReal || originReal === join(repoReal, '.bare');
  } catch {
    return false;
  }
}

async function resolveDefaultBranch(
  barePath: string,
  preferred: string,
  currentBranch: string,
  onOutput: GitOutputHandler,
): Promise<string> {
  if (await refExists(barePath, `refs/heads/${preferred}`)) {
    return preferred;
  }
  const remoteRef = `refs/remotes/origin/${preferred}`;
  if (await refExists(barePath, remoteRef)) {
    onOutput(`Creating local branch ${preferred} from origin/${preferred}`);
    await runGitStreaming(['-C', barePath, 'branch', '--no-track', preferred, remoteRef], {
      onOutput,
    });
    return preferred;
  }
  return currentBranch;
}

async function refExists(barePath: string, ref: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['-C', barePath, 'show-ref', '--verify', '--quiet', ref]);
    return true;
  } catch {
    return false;
  }
}

async function movePerWorktreeState(barePath: string, worktreePath: string): Promise<void> {
  const gitDir = await linkedGitDir(worktreePath);
  for (const name of PER_WORKTREE_FILES) {
    await moveIfExists(join(barePath, name), join(gitDir, name));
  }
  for (const name of PER_WORKTREE_DIRS) {
    await moveIfExists(join(barePath, name), join(gitDir, name));
  }
  await moveIfExists(join(barePath, 'logs', 'HEAD'), join(gitDir, 'logs', 'HEAD'));
}

async function linkedGitDir(worktreePath: string): Promise<string> {
  const raw = await readFile(join(worktreePath, '.git'), 'utf8');
  const match = raw.match(/^gitdir:\s*(.+)\s*$/);
  const gitDir = match?.[1];
  if (!gitDir) {
    throw new Error(`Expected a linked worktree at ${worktreePath}`);
  }
  return isAbsolute(gitDir) ? gitDir : join(worktreePath, gitDir);
}

async function moveIfExists(from: string, to: string): Promise<void> {
  try {
    await stat(from);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }
  await mkdir(dirname(to), { recursive: true });
  await rm(to, { recursive: true, force: true });
  await rename(from, to);
}

/** A repository with no commits cannot be bare-cloned. Keep its index and files. */
async function convertUnbornRepository(
  input: {
    repoPath: string;
    repoName: string;
    repoSlugSeparator?: string;
    onOutput: GitOutputHandler;
  },
  currentBranch: string,
): Promise<ConvertRepositoryResult> {
  const barePath = bareRepoPath(input.repoPath);
  const folder = worktreeFolderName(input.repoName, currentBranch, input.repoSlugSeparator);
  const worktreePath = join(input.repoPath, folder);

  input.onOutput(`No commits yet on ${currentBranch}`);
  input.onOutput(`Creating bare repository at ${barePath}`);
  await runGitStreaming(['init', '--bare', '-b', currentBranch, barePath], {
    onOutput: input.onOutput,
  });

  input.onOutput(`Moving the working tree into ${folder}`);
  await moveRootIntoWorktree(
    input.repoPath,
    worktreePath,
    new Set(['.bare', folder]),
    input.onOutput,
  );
  await runGitStreaming(['remote', 'add', 'origin', barePath], {
    cwd: worktreePath,
    onOutput: input.onOutput,
  });

  return { defaultBranch: currentBranch, currentBranch };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  const info = await lstatOrNull(path);
  return info?.isDirectory() ?? false;
}

async function lstatOrNull(path: string): Promise<Awaited<ReturnType<typeof lstat>> | null> {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
