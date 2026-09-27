import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  readRemoteRepositoryCache,
  writeRemoteRepositoryCache,
  shouldRefreshCache,
  cachedRemoteRepositoryNames,
  resolveRemoteRepositoryNames,
} from '../../src/github/remote-repository-cache';
import type { GitHubRepositoryListProvider } from '../../src/github/repository-list-provider';

describe('shouldRefreshCache', () => {
  it('returns true when cache is older than thirty days', () => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    expect(shouldRefreshCache(thirtyOneDaysAgo)).toBe(true);
  });

  it('returns false when cache is fresh', () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    expect(shouldRefreshCache(oneHourAgo)).toBe(false);
  });
});

describe('remote repository cache file', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'forest-cache-'));
  });

  it('stores multiple owners in one file', async () => {
    const path = join(dir, 'remote-repositories-cache.json');
    await writeRemoteRepositoryCache(path, {
      version: 1,
      entries: {
        'organization:acme': { repositoryNames: ['a'], fetchedAt: 1 },
        'user:octocat': { repositoryNames: ['b'], fetchedAt: 2 },
      },
    });
    const data = await readRemoteRepositoryCache(path);
    expect(data?.entries['user:octocat']?.repositoryNames).toEqual(['b']);
  });
});

describe('cachedRemoteRepositoryNames', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'forest-cache-'));
  });

  it('returns a stale list without treating it as fresh', async () => {
    const path = join(dir, 'remote-repositories-cache.json');
    const stale = Date.now() - 31 * 24 * 60 * 60 * 1000;
    await writeRemoteRepositoryCache(path, {
      version: 1,
      entries: {
        'organization:acme': { repositoryNames: ['old'], fetchedAt: stale },
      },
    });

    await expect(
      cachedRemoteRepositoryNames(path, { kind: 'organization', login: 'acme' }),
    ).resolves.toEqual({ repositoryNames: ['old'], fresh: false });
  });
});

describe('resolveRemoteRepositoryNames', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'forest-cache-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('caches per owner kind and login', async () => {
    const path = join(dir, 'remote-repositories-cache.json');
    const provider: GitHubRepositoryListProvider = {
      listRepositoryNames: vi.fn().mockResolvedValue(['repository-a']),
    };

    const owner = { kind: 'user' as const, login: 'octocat' };
    const names = await resolveRemoteRepositoryNames({
      cachePath: path,
      owner,
      provider,
      now: 1000,
    });

    expect(names).toEqual(['repository-a']);
    expect(provider.listRepositoryNames).toHaveBeenCalledOnce();

    const cached = await resolveRemoteRepositoryNames({
      cachePath: path,
      owner,
      provider,
      now: 2000,
    });
    expect(cached).toEqual(['repository-a']);
    expect(provider.listRepositoryNames).toHaveBeenCalledOnce();
  });

  it('refetches when cache entry is stale', async () => {
    const path = join(dir, 'remote-repositories-cache.json');
    const stale = Date.now() - 31 * 24 * 60 * 60 * 1000;
    await writeRemoteRepositoryCache(path, {
      version: 1,
      entries: {
        'organization:acme': { repositoryNames: ['old'], fetchedAt: stale },
      },
    });

    const provider: GitHubRepositoryListProvider = {
      listRepositoryNames: vi.fn().mockResolvedValue(['new']),
    };

    const names = await resolveRemoteRepositoryNames({
      cachePath: path,
      owner: { kind: 'organization', login: 'acme' },
      provider,
    });

    expect(names).toEqual(['new']);
  });
});
