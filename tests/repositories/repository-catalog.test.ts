import { describe, expect, it } from 'vitest';
import {
  buildRepositoryCatalog,
  filterRepositoryCatalogBySearch,
  sortRepositoriesByLastOpened,
} from '../../src/repositories/repository-catalog';
import type { LocalRepositoryMeta, RepositoryCatalogEntry } from '../../src/domain/types';

describe('sortRepositoriesByLastOpened', () => {
  it('sorts descending by lastOpenedAt', () => {
    const repositories: RepositoryCatalogEntry[] = [
      { name: 'a', clonedLocally: true, structure: 'standard', lastOpenedAt: 100 },
      { name: 'b', clonedLocally: true, structure: 'legacy', lastOpenedAt: 300 },
      { name: 'c', clonedLocally: false, structure: 'none', lastOpenedAt: 200 },
    ];
    expect(sortRepositoriesByLastOpened(repositories).map((r) => r.name)).toEqual(['b', 'a', 'c']);
  });

  it('lists locally cloned repositories before remote-only repositories', () => {
    const repositories: RepositoryCatalogEntry[] = [
      { name: 'remote-recent', clonedLocally: false, structure: 'none', lastOpenedAt: 999 },
      { name: 'local-old', clonedLocally: true, structure: 'standard', lastOpenedAt: 1 },
    ];
    expect(sortRepositoriesByLastOpened(repositories).map((r) => r.name)).toEqual([
      'local-old',
      'remote-recent',
    ]);
  });

  it('places repositories without lastOpenedAt last among same tier', () => {
    const repositories: RepositoryCatalogEntry[] = [
      { name: 'a', clonedLocally: false, structure: 'none' },
      { name: 'b', clonedLocally: false, structure: 'none', lastOpenedAt: 1 },
    ];
    expect(sortRepositoriesByLastOpened(repositories)[0]?.name).toBe('b');
  });
});

describe('filterRepositoryCatalogBySearch', () => {
  it('keeps locally cloned repositories above remote-only matches when searching', () => {
    const repositories: RepositoryCatalogEntry[] = [
      { name: 'acme-remote-only', clonedLocally: false, structure: 'none' },
      { name: 'acme-local', clonedLocally: true, structure: 'standard' },
    ];
    expect(
      filterRepositoryCatalogBySearch(repositories, 'acme', (r) => r.name).map((r) => r.name),
    ).toEqual(['acme-local', 'acme-remote-only']);
  });

  it('sorts filtered matches by lastOpenedAt within each tier', () => {
    const repositories: RepositoryCatalogEntry[] = [
      { name: 'forest-old', clonedLocally: true, structure: 'standard', lastOpenedAt: 10 },
      { name: 'forest-new', clonedLocally: true, structure: 'standard', lastOpenedAt: 100 },
      { name: 'forest-remote', clonedLocally: false, structure: 'none', lastOpenedAt: 999 },
    ];
    expect(
      filterRepositoryCatalogBySearch(repositories, 'forest', (r) => r.name).map((r) => r.name),
    ).toEqual(['forest-new', 'forest-old', 'forest-remote']);
  });
});

describe('buildRepositoryCatalog', () => {
  it('merges org repository names with local metadata', () => {
    const local: LocalRepositoryMeta[] = [
      { name: 'forest-cli', path: '/dev/forest-cli', structure: 'standard', lastOpenedAt: 10 },
    ];
    const catalog = buildRepositoryCatalog(['forest-cli', 'forest-app'], local);

    expect(catalog.find((r) => r.name === 'forest-cli')).toMatchObject({
      clonedLocally: true,
      structure: 'standard',
    });
    expect(catalog.find((r) => r.name === 'forest-app')).toMatchObject({
      clonedLocally: false,
      structure: 'none',
    });
  });

  it('includes local-only repositories not in organization list', () => {
    const local: LocalRepositoryMeta[] = [
      { name: 'personal-fork', path: '/dev/personal-fork', structure: 'legacy' },
    ];
    const catalog = buildRepositoryCatalog([], local);
    expect(catalog).toHaveLength(1);
    expect(catalog[0]?.clonedLocally).toBe(true);
    expect(catalog[0]?.structure).toBe('legacy');
  });
});
