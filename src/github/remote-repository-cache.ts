import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { GitHubOwner } from '../domain/github-owner';
import { githubOwnerCacheKey } from '../domain/github-owner';
import type { GitHubRepositoryListProvider } from './repository-list-provider';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export interface RemoteRepositoryCacheEntry {
  repositoryNames: string[];
  fetchedAt: number;
}

export interface RemoteRepositoryCacheFile {
  version: 1;
  entries: Record<string, RemoteRepositoryCacheEntry>;
}

export function shouldRefreshCache(fetchedAt?: number, now = Date.now()): boolean {
  if (fetchedAt === undefined) {
    return true;
  }
  return now - fetchedAt >= THIRTY_DAYS;
}

export async function readRemoteRepositoryCache(
  path: string,
): Promise<RemoteRepositoryCacheFile | null> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as RemoteRepositoryCacheFile;
    if (parsed.version !== 1 || !parsed.entries || typeof parsed.entries !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeRemoteRepositoryCache(
  path: string,
  file: RemoteRepositoryCacheFile,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(file, null, 2), 'utf8');
}

export interface ResolveRemoteRepositoryNamesOptions {
  cachePath: string;
  owner: GitHubOwner;
  provider: GitHubRepositoryListProvider;
  now?: number;
}

/** Names already on disk, including a stale list. `fresh` is false when GitHub should be fetched. */
export async function cachedRemoteRepositoryNames(
  cachePath: string,
  owner: GitHubOwner,
  now = Date.now(),
): Promise<{ repositoryNames: string[]; fresh: boolean }> {
  const existing = (await readRemoteRepositoryCache(cachePath))?.entries[
    githubOwnerCacheKey(owner)
  ];
  if (!existing) {
    return { repositoryNames: [], fresh: false };
  }
  return {
    repositoryNames: existing.repositoryNames,
    fresh: !shouldRefreshCache(existing.fetchedAt, now),
  };
}

export async function resolveRemoteRepositoryNames(
  options: ResolveRemoteRepositoryNamesOptions,
): Promise<string[]> {
  const key = githubOwnerCacheKey(options.owner);
  const cache = (await readRemoteRepositoryCache(options.cachePath)) ?? {
    version: 1,
    entries: {},
  };

  const existing = cache.entries[key];
  if (existing && !shouldRefreshCache(existing.fetchedAt, options.now)) {
    return existing.repositoryNames;
  }

  const repositoryNames = await options.provider.listRepositoryNames(options.owner);
  const fetchedAt = options.now ?? Date.now();
  cache.entries[key] = { repositoryNames, fetchedAt };
  await writeRemoteRepositoryCache(options.cachePath, cache);
  return repositoryNames;
}
