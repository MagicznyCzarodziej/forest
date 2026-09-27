import { describe, expect, it } from 'vitest';
import { parseBranchNames, withUnbornHeadBranch } from '../../src/worktrees/scan-worktrees';

describe('parseBranchNames', () => {
  it('reads local heads from a bare clone', () => {
    expect(parseBranchNames('master\nfeature/login\n', false)).toEqual(['master', 'feature/login']);
  });

  it('strips origin and excludes its HEAD pointer', () => {
    expect(
      parseBranchNames('origin/HEAD -> origin/master\norigin/master\norigin/feature/login\n', true),
    ).toEqual(['master', 'feature/login']);
  });
});

describe('withUnbornHeadBranch', () => {
  it('uses the symbolic HEAD when the bare repository has no branch refs', () => {
    expect(withUnbornHeadBranch([], 'ref: refs/heads/master\n')).toEqual(['master']);
  });

  it('keeps real branch refs', () => {
    expect(withUnbornHeadBranch(['master', 'feature'], 'ref: refs/heads/master\n')).toEqual([
      'master',
      'feature',
    ]);
  });
});
