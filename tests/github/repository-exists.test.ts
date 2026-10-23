import { describe, expect, it } from 'vitest';
import { GitHubRepositoryLookupError } from '../../src/infrastructure/github/repository-exists';

describe('GitHubRepositoryLookupError', () => {
  it('names lookup failures', () => {
    const error = new GitHubRepositoryLookupError('network down');
    expect(error.name).toBe('GitHubRepositoryLookupError');
    expect(error.message).toBe('network down');
  });
});
