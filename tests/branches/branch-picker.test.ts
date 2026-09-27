import { describe, expect, it } from 'vitest';
import { canConfirmBranchSelection, sortBranches } from '../../src/branches/branch-picker';

describe('sortBranches', () => {
  it('places default branch first then alphabetical', () => {
    expect(sortBranches(['feature', 'master', 'develop'], 'master')).toEqual([
      'master',
      'develop',
      'feature',
    ]);
  });
});

describe('canConfirmBranchSelection', () => {
  const branches = ['master', 'feature-a'];

  it('returns false when filter has no matches', () => {
    expect(canConfirmBranchSelection(branches, 'zzz', ['master'])).toBe(false);
  });

  it('returns true when filter matches at least one branch', () => {
    expect(canConfirmBranchSelection(branches, 'feat', ['feature-a'])).toBe(true);
  });
});
