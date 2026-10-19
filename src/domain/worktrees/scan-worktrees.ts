import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { branchFromHead, detectCurrentBranch } from '../../infrastructure/git/default-branch';
import { DEFAULT_REPOSITORY_WORKTREE_SEPARATOR } from '../repositories/repository-structure';
import type { RawWorktree } from './worktree-catalog';
import { type RepositoryStateStore } from '../state/repository-state';

const execFileAsync = promisify(execFile);

async function readBranchAtPath(path: string): Promise<string | null> {
  try {
    const branch = await detectCurrentBranch(path);
    return branch || null;
  } catch {
    return null;
  }
}

export async function scanWorktrees(
  repositoryPath: string,
  repositoryName: string,
  stateStore: RepositoryStateStore,
  repositoryWorktreeSeparator = DEFAULT_REPOSITORY_WORKTREE_SEPARATOR,
): Promise<RawWorktree[]> {
  const entries = await readdir(repositoryPath);
  const prefix = `${repositoryName}${repositoryWorktreeSeparator}`;
  const worktrees: RawWorktree[] = [];

  for (const entry of entries) {
    if (!entry.startsWith(prefix)) {
      continue;
    }
    const path = join(repositoryPath, entry);
    const info = await stat(path);
    if (!info.isDirectory()) {
      continue;
    }
    const branch = await readBranchAtPath(path);
    if (!branch) {
      continue;
    }
    const state = await stateStore.getWorktree(path);
    worktrees.push({
      folderName: entry,
      branch,
      path,
      lastUsedAt: state?.lastUsedAt,
    });
  }

  return worktrees;
}

export function parseBranchNames(output: string, remoteTracking: boolean): string[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .map((branch) => (remoteTracking ? branch.replace(/^origin\//, '') : branch))
    .filter((branch) => branch && !branch.includes('HEAD'));
}

/** An unborn bare repository has a symbolic HEAD but no `refs/heads` entries yet. */
export function withUnbornHeadBranch(branches: string[], head: string): string[] {
  if (branches.length > 0) {
    return branches;
  }
  const branch = branchFromHead(head);
  return branch ? [branch] : [];
}

/** Merges bare clone heads with remote-tracking refs after `git fetch`. */
export function mergeBareBranchNames(localHeads: string[], originRefsStdout: string): string[] {
  const fromOrigin = parseBranchNames(originRefsStdout, true);
  return [...new Set([...localHeads, ...fromOrigin])].filter(
    (branch) => branch && !branch.includes('HEAD'),
  );
}

async function forEachRefShortNames(cwd: string, refPrefix: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'git',
    ['for-each-ref', '--format=%(refname:short)', refPrefix],
    { cwd },
  );
  return stdout;
}

export async function listRemoteBranches(repositoryPath: string, bare: boolean): Promise<string[]> {
  const cwd = bare ? join(repositoryPath, '.bare') : repositoryPath;
  try {
    if (!bare) {
      const { stdout } = await execFileAsync('git', ['branch', '-r'], { cwd });
      return parseBranchNames(stdout, true);
    }

    // `git clone --bare` copies remote branches to refs/heads rather than
    // refs/remotes/origin; after fetch, new branches appear under refs/remotes/origin.
    const headsStdout = await forEachRefShortNames(cwd, 'refs/heads');
    const localHeads = parseBranchNames(headsStdout, false);
    const originStdout = await forEachRefShortNames(cwd, 'refs/remotes/origin');
    const names = mergeBareBranchNames(localHeads, originStdout);
    if (names.length > 0) {
      return names;
    }
    const head = await readFile(join(cwd, 'HEAD'), 'utf8');
    return withUnbornHeadBranch(names, head);
  } catch {
    return [];
  }
}
