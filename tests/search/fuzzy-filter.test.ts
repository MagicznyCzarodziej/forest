import { describe, expect, it } from 'vitest';
import { fuzzyFilter } from '../../src/search/fuzzy-filter';

describe('fuzzyFilter', () => {
  const items = [
    { id: '1', label: 'forest-cli' },
    { id: '2', label: 'forest-app' },
    { id: '3', label: 'backend-api' },
    { id: '4', label: 'mobile-ios' },
  ];

  it('returns all items when query is empty', () => {
    expect(fuzzyFilter(items, '', (i) => i.label)).toHaveLength(4);
  });

  it('filters by name substring-style fuzzy match', () => {
    const result = fuzzyFilter(items, 'forest', (i) => i.label);
    expect(result.map((i) => i.label).sort()).toEqual(['forest-app', 'forest-cli']);
  });

  it('keeps a close fuzzy match and drops a weak one', () => {
    expect(fuzzyFilter(items, 'fores', (i) => i.label).map((i) => i.label)).toEqual([
      'forest-app',
      'forest-cli',
    ]);
    expect(fuzzyFilter(items, 'bakend', (i) => i.label)).toEqual([]);
  });

  it("returns every match past fuzzysort's default cap of 10", () => {
    const many = Array.from({ length: 12 }, (_, index) => ({ label: `table-${index}` }));
    expect(fuzzyFilter(many, 'tabl', (item) => item.label)).toHaveLength(12);
  });

  it('sorts by score descending', () => {
    const result = fuzzyFilter(items, 'for', (i) => i.label);
    expect(result[0]?.label).toMatch(/^forest/);
  });
});
