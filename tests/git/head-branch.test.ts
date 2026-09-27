import { describe, expect, it } from 'vitest';
import { branchFromHead } from '../../src/git/default-branch';

describe('branchFromHead', () => {
  it('reads an unborn branch from HEAD', () => {
    expect(branchFromHead('ref: refs/heads/master\n')).toBe('master');
  });

  it('returns null for a detached commit', () => {
    expect(branchFromHead('0123456789abcdef\n')).toBeNull();
  });
});
