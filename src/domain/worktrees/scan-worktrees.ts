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

export async function listRemoteBranches(repositoryPath: string, bare: boolean): Promise<string[]> {
  const cwd = bare ? join(repositoryPath, '.bare') : repositoryPath;
  try {
    // `git clone --bare` copies remote branches to refs/heads rather than
    // refs/remotes/origin, so `git branch -r` is empty in forest's layout.
    const args = bare
      ? ['for-each-ref', '--format=%(refname:strip=2)', 'refs/heads']
      : ['branch', '-r'];
    const { stdout } = await execFileAsync('git', args, { cwd });
    const names = parseBranchNames(stdout, !bare);
    if (!bare || names.length > 0) {
      return names;
    }
    const head = await readFile(join(cwd, 'HEAD'), 'utf8');
    return withUnbornHeadBranch(names, head);
  } catch {
    return [];
  }
}
