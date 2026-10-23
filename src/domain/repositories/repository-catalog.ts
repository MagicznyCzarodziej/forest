import type { LocalRepositoryMeta, RepositoryCatalogEntry } from '../types';
import { fuzzyFilter } from '../search/fuzzy-filter';

/** GitHub repository names: 1–100 chars from this set. */
const GITHUB_REPOSITORY_NAME = /^[a-zA-Z0-9._-]{1,100}$/;

export function isPlausibleGitHubRepositoryName(name: string): boolean {
  return GITHUB_REPOSITORY_NAME.test(name);
}

export function findRepositoryByExactName(
  repositories: RepositoryCatalogEntry[],
  name: string,
): RepositoryCatalogEntry | undefined {
  return repositories.find((repository) => repository.name === name);
}

/** Lets users clone a repo that is missing from a stale or empty remote cache. */
export function remoteCloneByNameCandidate(
  repositories: RepositoryCatalogEntry[],
  query: string,
): RepositoryCatalogEntry | undefined {
  const name = query.trim();
  if (!isPlausibleGitHubRepositoryName(name)) {
    return undefined;
  }
  if (findRepositoryByExactName(repositories, name)) {
    return undefined;
  }
  return { name, clonedLocally: false, structure: 'none' };
}

export function repositoryPickerEntries(
  filtered: RepositoryCatalogEntry[],
  repositories: RepositoryCatalogEntry[],
  query: string,
): RepositoryCatalogEntry[] {
  const candidate = remoteCloneByNameCandidate(repositories, query);
  if (!candidate) {
    return filtered;
  }
  return [candidate, ...filtered];
}

export function filterRepositoryPickerEntries(
  repositories: RepositoryCatalogEntry[],
  query: string,
  getLabel: (repository: RepositoryCatalogEntry) => string,
): RepositoryCatalogEntry[] {
  const filtered = filterRepositoryCatalogBySearch(repositories, query, getLabel);
  return repositoryPickerEntries(filtered, repositories, query);
}

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
