import { describe, expect, it } from 'vitest';
import { resolveStartContext } from '../../src/domain/repositories/detect-context';

describe('resolveStartContext', () => {
  it('starts at repository list when there is no repository context', () => {
    expect(resolveStartContext(null)).toEqual({ screen: 'repositories' });
  });

  it('starts at worktrees when a repository context is present', () => {
    expect(
      resolveStartContext({
        repositoryName: 'my-repository',
        repositoryPath: '/Users/dev/my-repository',
      }),
    ).toEqual({
      screen: 'worktrees',
      repositoryName: 'my-repository',
      repositoryPath: '/Users/dev/my-repository',
    });
  });
});
