import { describe, expect, it } from "vitest";
import { buildRepoCatalog, sortReposByLastOpened } from "../../src/repos/repo-catalog.js";
import type { LocalRepoMeta, RepoCatalogEntry } from "../../src/domain/types.js";

describe("sortReposByLastOpened", () => {
  it("sorts descending by lastOpenedAt", () => {
    const repos: RepoCatalogEntry[] = [
      { name: "a", clonedLocally: true, structure: "standard", lastOpenedAt: 100 },
      { name: "b", clonedLocally: true, structure: "legacy", lastOpenedAt: 300 },
      { name: "c", clonedLocally: false, structure: "none", lastOpenedAt: 200 },
    ];
    expect(sortReposByLastOpened(repos).map((r) => r.name)).toEqual(["b", "c", "a"]);
  });

  it("places repos without lastOpenedAt last among same tier", () => {
    const repos: RepoCatalogEntry[] = [
      { name: "a", clonedLocally: false, structure: "none" },
      { name: "b", clonedLocally: false, structure: "none", lastOpenedAt: 1 },
    ];
    expect(sortReposByLastOpened(repos)[0]?.name).toBe("b");
  });
});

describe("buildRepoCatalog", () => {
  it("merges org repo names with local metadata", () => {
    const local: LocalRepoMeta[] = [
      { name: "forest-cli", path: "/dev/forest-cli", structure: "standard", lastOpenedAt: 10 },
    ];
    const catalog = buildRepoCatalog({
      remoteRepoNames: ["forest-cli", "forest-app"],
      localRepos: local,
    });

    expect(catalog.find((r) => r.name === "forest-cli")).toMatchObject({
      clonedLocally: true,
      structure: "standard",
    });
    expect(catalog.find((r) => r.name === "forest-app")).toMatchObject({
      clonedLocally: false,
      structure: "none",
    });
  });

  it("includes local-only repos not in organization list", () => {
    const local: LocalRepoMeta[] = [
      { name: "personal-fork", path: "/dev/personal-fork", structure: "legacy" },
    ];
    const catalog = buildRepoCatalog({
      remoteRepoNames: [],
      localRepos: local,
    });
    expect(catalog).toHaveLength(1);
    expect(catalog[0]?.clonedLocally).toBe(true);
    expect(catalog[0]?.structure).toBe("legacy");
  });
});
