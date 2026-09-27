import { readdir, stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LocalRepoMeta } from '../domain/types';
import { DEFAULT_BRANCH } from '../git/default-branch';
import { DEFAULT_REPO_SLUG_SEPARATOR, detectRepoStructure } from './repo-structure';
import type { RepoStateStore } from '../state/repo-state';

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readDefaultBranch(repoPath: string, hasBare: boolean): Promise<string> {
  const headPath = hasBare ? join(repoPath, '.bare', 'HEAD') : join(repoPath, '.git', 'HEAD');
  try {
    const head = await readFile(headPath, 'utf8');
    const match = head.match(/ref: refs\/heads\/(.+)/);
    return match?.[1]?.trim() || DEFAULT_BRANCH;
  } catch {
    return DEFAULT_BRANCH;
  }
}

export async function scanLocalRepos(
  root: string,
  stateStore: RepoStateStore,
  repoSlugSeparator = DEFAULT_REPO_SLUG_SEPARATOR,
): Promise<LocalRepoMeta[]> {
  let entries: string[];
  try {
    entries = await readdir(root);
  } catch {
    return [];
  }

  const repos: LocalRepoMeta[] = [];
  for (const name of entries) {
    if (name.startsWith('.')) {
      continue;
    }
    const repoPath = join(root, name);
    const info = await stat(repoPath);
    if (!info.isDirectory()) {
      continue;
    }

    const hasBare = await pathExists(join(repoPath, '.bare'));
    const hasRootGit = await pathExists(join(repoPath, '.git'));
    if (!hasBare && !hasRootGit) {
      continue;
    }

    const children = await readdir(repoPath);
    const defaultBranch = await readDefaultBranch(repoPath, hasBare);
    let hasWorktreeCheckout: boolean | undefined;
    if (hasBare) {
      hasWorktreeCheckout = false;
      for (const child of children) {
        if (child === '.bare' || child.startsWith('.')) {
          continue;
        }
        if (await pathExists(join(repoPath, child, '.git'))) {
          hasWorktreeCheckout = true;
          break;
        }
      }
    }
    const structure = detectRepoStructure({
      repoPath,
      repoName: name,
      hasBareDir: hasBare,
      hasRootGit,
      childDirNames: children,
      defaultBranch,
      repoSlugSeparator,
      hasWorktreeCheckout,
    });

    if (structure !== 'standard' && structure !== 'legacy') {
      continue;
    }

    const state = await stateStore.getRepo(name);
    repos.push({
      name,
      path: repoPath,
      structure,
      lastOpenedAt: state?.lastOpenedAt,
    });
  }

  return repos;
}
