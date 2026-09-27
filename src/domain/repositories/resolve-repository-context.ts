import { access } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import type { RepositoryContext } from './detect-context';
import { isPathInside } from './paths';

function normalizePath(path: string): string {
  const resolved = resolve(path);
  return resolved.endsWith(sep) ? resolved.slice(0, -1) : resolved;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function isForestRepositoryContainer(repositoryPath: string): Promise<boolean> {
  if (await pathExists(join(repositoryPath, '.bare'))) {
    return true;
  }
  return pathExists(join(repositoryPath, '.git'));
}

export async function resolveRepositoryContextFromCurrentPath(
  currentPath: string,
  root: string,
): Promise<RepositoryContext | null> {
  if (!isPathInside(root, currentPath)) {
    return null;
  }

  const normalizedRoot = normalizePath(root);
  let candidate = normalizePath(currentPath);

  while (isPathInside(normalizedRoot, candidate)) {
    if (normalizePath(dirname(candidate)) === normalizedRoot) {
      if (await isForestRepositoryContainer(candidate)) {
        return {
          repositoryName: basename(candidate),
          repositoryPath: candidate,
        };
      }
    }
    if (candidate === normalizedRoot) {
      break;
    }
    candidate = normalizePath(dirname(candidate));
  }

  return null;
}
