import { describe, expect, it } from 'vitest';
import { resolveStableSelectionIndex } from '../../src/ui/hooks/useFilteredIndex';

describe('resolveStableSelectionIndex', () => {
  const getLabel = (branch: string) => branch;

  it('finds the previously selected branch after the list grows', () => {
    const expanded = ['master', 'develop', 'feature', 'feature/new', 'release'];
    expect(resolveStableSelectionIndex(expanded, 2, 'feature', getLabel)).toEqual({
      index: 2,
      label: 'feature',
    });
  });

  it('finds the previously selected branch after sort order changes', () => {
    const reordered = ['develop', 'feature', 'master'];
    expect(resolveStableSelectionIndex(reordered, 0, 'feature', getLabel)).toEqual({
      index: 1,
      label: 'feature',
    });
  });

  it('clamps the index when the selected branch is no longer listed', () => {
    expect(resolveStableSelectionIndex(['master'], 5, 'feature', getLabel)).toEqual({
      index: 0,
      label: 'master',
    });
  });
});
