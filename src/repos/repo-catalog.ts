import type { LocalRepoMeta, RepoCatalogEntry } from '../domain/types.js';
import { fuzzyFilter } from '../search/fuzzy-filter.js';

export function sortReposByLastOpened(repos: RepoCatalogEntry[]): RepoCatalogEntry[] {
  return [...repos].sort((a, b) => {
    if (a.clonedLocally !== b.clonedLocally) {
      return a.clonedLocally ? -1 : 1;
    }
    const aTime = a.lastOpenedAt ?? -1;
    const bTime = b.lastOpenedAt ?? -1;
    return bTime - aTime;
  });
}

export interface BuildRepoCatalogInput {
  remoteRepoNames: string[];
  localRepos: LocalRepoMeta[];
}

export function buildRepoCatalog(input: BuildRepoCatalogInput): RepoCatalogEntry[] {
  const localByName = new Map(input.localRepos.map((r) => [r.name, r]));
  const names = new Set<string>([...input.remoteRepoNames, ...input.localRepos.map((r) => r.name)]);

  const entries: RepoCatalogEntry[] = [];
  for (const name of names) {
    const local = localByName.get(name);
    if (local) {
      entries.push({
        name,
        clonedLocally: true,
        structure: local.structure,
        path: local.path,
        lastOpenedAt: local.lastOpenedAt,
      });
    } else {
      entries.push({
        name,
        clonedLocally: false,
        structure: 'none',
      });
    }
  }

  return sortReposByLastOpened(entries);
}

export function filterRepoCatalogBySearch(
  repos: RepoCatalogEntry[],
  query: string,
  getLabel: (repo: RepoCatalogEntry) => string,
): RepoCatalogEntry[] {
  const matched = fuzzyFilter(repos, query, getLabel);
  if (!query.trim()) {
    return matched;
  }
  return sortReposByLastOpened(matched);
}
