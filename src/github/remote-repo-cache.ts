import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { GitHubOwner } from "../domain/github-owner.js";
import { githubOwnerCacheKey } from "../domain/github-owner.js";
import type { GitHubRepoListProvider } from "./repo-list-provider.js";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export interface RemoteRepoCacheEntry {
  repoNames: string[];
  fetchedAt: number;
}

export interface RemoteRepoCacheFile {
  version: 1;
  entries: Record<string, RemoteRepoCacheEntry>;
}

export function shouldRefreshCache(fetchedAt?: number, now = Date.now()): boolean {
  if (fetchedAt === undefined) {
    return true;
  }
  return now - fetchedAt >= THIRTY_DAYS;
}

export async function readRemoteRepoCache(path: string): Promise<RemoteRepoCacheFile | null> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as RemoteRepoCacheFile;
    if (parsed.version !== 1 || !parsed.entries || typeof parsed.entries !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeRemoteRepoCache(
  path: string,
  file: RemoteRepoCacheFile,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(file, null, 2), "utf8");
}

export interface ResolveRemoteRepoNamesOptions {
  cachePath: string;
  owner: GitHubOwner;
  provider: GitHubRepoListProvider;
  now?: number;
}

/** Names already on disk, including a stale list. `fresh` is false when GitHub should be fetched. */
export async function cachedRemoteRepoNames(
  cachePath: string,
  owner: GitHubOwner,
  now = Date.now(),
): Promise<{ repoNames: string[]; fresh: boolean }> {
  const existing = (await readRemoteRepoCache(cachePath))?.entries[githubOwnerCacheKey(owner)];
  if (!existing) {
    return { repoNames: [], fresh: false };
  }
  return {
    repoNames: existing.repoNames,
    fresh: !shouldRefreshCache(existing.fetchedAt, now),
  };
}

export async function resolveRemoteRepoNames(
  options: ResolveRemoteRepoNamesOptions,
): Promise<string[]> {
  const key = githubOwnerCacheKey(options.owner);
  const cache = (await readRemoteRepoCache(options.cachePath)) ?? {
    version: 1,
    entries: {},
  };

  const existing = cache.entries[key];
  if (existing && !shouldRefreshCache(existing.fetchedAt, options.now)) {
    return existing.repoNames;
  }

  const repoNames = await options.provider.listRepoNames(options.owner);
  const fetchedAt = options.now ?? Date.now();
  cache.entries[key] = { repoNames, fetchedAt };
  await writeRemoteRepoCache(options.cachePath, cache);
  return repoNames;
}
