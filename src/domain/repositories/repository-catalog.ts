import type { LocalRepositoryMeta, RepositoryCatalogEntry } from '../types';
import { fuzzyFilter } from '../search/fuzzy-filter';

export function sortRepositoriesByLastOpened(
  repositories: RepositoryCatalogEntry[],
): RepositoryCatalogEntry[] {
  return [...repositories].sort((a, b) => {
    if (a.clonedLocally !== b.clonedLocally) {
      return a.clonedLocally ? -1 : 1;
    }
    const aTime = a.lastOpenedAt ?? -1;
    const bTime = b.lastOpenedAt ?? -1;
    return bTime - aTime;
  });
}

export function buildRepositoryCatalog(
  remoteRepositoryNames: string[],
  localRepositories: LocalRepositoryMeta[],
): RepositoryCatalogEntry[] {
  const localByName = new Map(localRepositories.map((r) => [r.name, r]));
  const names = new Set<string>([
    ...remoteRepositoryNames,
    ...localRepositories.map((r) => r.name),
  ]);

  const entries: RepositoryCatalogEntry[] = [];
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

  return sortRepositoriesByLastOpened(entries);
}

export function filterRepositoryCatalogBySearch(
  repositories: RepositoryCatalogEntry[],
  query: string,
  getLabel: (repository: RepositoryCatalogEntry) => string,
): RepositoryCatalogEntry[] {
  const matched = fuzzyFilter(repositories, query, getLabel);
  if (!query.trim()) {
    return matched;
  }
  return sortRepositoriesByLastOpened(matched);
}
