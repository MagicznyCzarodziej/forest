import { readdir, stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LocalRepositoryMeta } from '../domain/types';
import { DEFAULT_BRANCH } from '../git/default-branch';
import {
  DEFAULT_REPOSITORY_WORKTREE_SEPARATOR,
  detectRepositoryStructure,
} from './repository-structure';
import type { RepositoryStateStore } from '../state/repository-state';

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readDefaultBranch(repositoryPath: string, hasBare: boolean): Promise<string> {
  const headPath = hasBare
    ? join(repositoryPath, '.bare', 'HEAD')
    : join(repositoryPath, '.git', 'HEAD');
  try {
    const head = await readFile(headPath, 'utf8');
    const match = head.match(/ref: refs\/heads\/(.+)/);
    return match?.[1]?.trim() || DEFAULT_BRANCH;
  } catch {
    return DEFAULT_BRANCH;
  }
}

export async function scanLocalRepositories(
  root: string,
  stateStore: RepositoryStateStore,
  repositoryWorktreeSeparator = DEFAULT_REPOSITORY_WORKTREE_SEPARATOR,
): Promise<LocalRepositoryMeta[]> {
  let entries: string[];
  try {
    entries = await readdir(root);
  } catch {
    return [];
  }

  const repositories: LocalRepositoryMeta[] = [];
  for (const name of entries) {
    if (name.startsWith('.')) {
      continue;
    }
    const repositoryPath = join(root, name);
    const info = await stat(repositoryPath);
    if (!info.isDirectory()) {
      continue;
    }

    const hasBare = await pathExists(join(repositoryPath, '.bare'));
    const hasRootGit = await pathExists(join(repositoryPath, '.git'));
    if (!hasBare && !hasRootGit) {
      continue;
    }

    const children = await readdir(repositoryPath);
    const defaultBranch = await readDefaultBranch(repositoryPath, hasBare);
    let hasWorktreeCheckout: boolean | undefined;
    if (hasBare) {
      hasWorktreeCheckout = false;
      for (const child of children) {
        if (child === '.bare' || child.startsWith('.')) {
          continue;
        }
        if (await pathExists(join(repositoryPath, child, '.git'))) {
          hasWorktreeCheckout = true;
          break;
        }
      }
    }
    const structure = detectRepositoryStructure({
      repositoryPath,
      repositoryName: name,
      hasBareDir: hasBare,
      hasRootGit,
      childDirNames: children,
      defaultBranch,
      repositoryWorktreeSeparator,
      hasWorktreeCheckout,
    });

    if (structure !== 'standard' && structure !== 'legacy') {
      continue;
    }

    const state = await stateStore.getRepository(name);
    repositories.push({
      name,
      path: repositoryPath,
      structure,
      lastOpenedAt: state?.lastOpenedAt,
    });
  }

  return repositories;
}
