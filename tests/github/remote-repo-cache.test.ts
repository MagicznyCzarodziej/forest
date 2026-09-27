import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  readRemoteRepoCache,
  writeRemoteRepoCache,
  shouldRefreshCache,
  cachedRemoteRepoNames,
  resolveRemoteRepoNames,
} from "../../src/github/remote-repo-cache.js";
import type { GitHubRepoListProvider } from "../../src/github/repo-list-provider.js";

describe("shouldRefreshCache", () => {
  it("returns true when cache is older than thirty days", () => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    expect(shouldRefreshCache(thirtyOneDaysAgo)).toBe(true);
  });

  it("returns false when cache is fresh", () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    expect(shouldRefreshCache(oneHourAgo)).toBe(false);
  });
});

describe("remote repo cache file", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "forest-cache-"));
  });

  it("stores multiple owners in one file", async () => {
    const path = join(dir, "remote-repos-cache.json");
    await writeRemoteRepoCache(path, {
      version: 1,
      entries: {
        "organization:acme": { repoNames: ["a"], fetchedAt: 1 },
        "user:octocat": { repoNames: ["b"], fetchedAt: 2 },
      },
    });
    const data = await readRemoteRepoCache(path);
    expect(data?.entries["user:octocat"]?.repoNames).toEqual(["b"]);
  });
});

describe("cachedRemoteRepoNames", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "forest-cache-"));
  });

  it("returns a stale list without treating it as fresh", async () => {
    const path = join(dir, "remote-repos-cache.json");
    const stale = Date.now() - 31 * 24 * 60 * 60 * 1000;
    await writeRemoteRepoCache(path, {
      version: 1,
      entries: {
        "organization:acme": { repoNames: ["old"], fetchedAt: stale },
      },
    });

    await expect(
      cachedRemoteRepoNames(path, { kind: "organization", login: "acme" }),
    ).resolves.toEqual({ repoNames: ["old"], fresh: false });
  });
});

describe("resolveRemoteRepoNames", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "forest-cache-"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("caches per owner kind and login", async () => {
    const path = join(dir, "remote-repos-cache.json");
    const provider: GitHubRepoListProvider = {
      listRepoNames: vi.fn().mockResolvedValue(["repo-a"]),
    };

    const owner = { kind: "user" as const, login: "octocat" };
    const names = await resolveRemoteRepoNames({
      cachePath: path,
      owner,
      provider,
      now: 1000,
    });

    expect(names).toEqual(["repo-a"]);
    expect(provider.listRepoNames).toHaveBeenCalledOnce();

    const cached = await resolveRemoteRepoNames({
      cachePath: path,
      owner,
      provider,
      now: 2000,
    });
    expect(cached).toEqual(["repo-a"]);
    expect(provider.listRepoNames).toHaveBeenCalledOnce();
  });

  it("refetches when cache entry is stale", async () => {
    const path = join(dir, "remote-repos-cache.json");
    const stale = Date.now() - 31 * 24 * 60 * 60 * 1000;
    await writeRemoteRepoCache(path, {
      version: 1,
      entries: {
        "organization:acme": { repoNames: ["old"], fetchedAt: stale },
      },
    });

    const provider: GitHubRepoListProvider = {
      listRepoNames: vi.fn().mockResolvedValue(["new"]),
    };

    const names = await resolveRemoteRepoNames({
      cachePath: path,
      owner: { kind: "organization", login: "acme" },
      provider,
    });

    expect(names).toEqual(["new"]);
  });
});
