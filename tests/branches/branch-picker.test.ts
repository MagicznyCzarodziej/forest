import { describe, expect, it } from 'vitest';
import { sortBranches } from '../../src/ui/hooks/useWorktreeCatalog/sortBranches';

describe('sortBranches', () => {
  it('places default branch first then alphabetical', () => {
    expect(sortBranches(['feature', 'master', 'develop'], 'master')).toEqual([
      'master',
      'develop',
      'feature',
    ]);
  });
});
