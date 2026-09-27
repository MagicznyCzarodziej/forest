import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { branchFromHead, detectCurrentBranch } from '../git/default-branch';
import { DEFAULT_REPO_SLUG_SEPARATOR } from '../repos/repo-structure';
import type { RawWorktree } from './worktree-catalog';
import { type RepoStateStore } from '../state/repo-state';

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
  repoPath: string,
  repoName: string,
  stateStore: RepoStateStore,
  repoSlugSeparator = DEFAULT_REPO_SLUG_SEPARATOR,
): Promise<RawWorktree[]> {
  const entries = await readdir(repoPath);
  const prefix = `${repoName}${repoSlugSeparator}`;
  const worktrees: RawWorktree[] = [];

  for (const entry of entries) {
    if (!entry.startsWith(prefix)) {
      continue;
    }
    const path = join(repoPath, entry);
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

/** An unborn bare repo has a symbolic HEAD but no `refs/heads` entries yet. */
export function withUnbornHeadBranch(branches: string[], head: string): string[] {
  if (branches.length > 0) {
    return branches;
  }
  const branch = branchFromHead(head);
  return branch ? [branch] : [];
}

export async function listRemoteBranches(repoPath: string, bare: boolean): Promise<string[]> {
  const cwd = bare ? join(repoPath, '.bare') : repoPath;
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
