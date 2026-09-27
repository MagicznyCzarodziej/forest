import { describe, expect, it } from 'vitest';
import {
  parseRepositoryNameLines,
  repositoryNamesGraphql,
} from '../../src/github/repository-list-provider';

describe('repositoryNamesGraphql', () => {
  it('pages organization repository names', () => {
    const { query, jq } = repositoryNamesGraphql({ kind: 'organization', login: 'acme' });
    expect(query).toContain('organization(login: $login)');
    expect(query).toContain('repositories(first: 100, after: $endCursor');
    expect(query).toContain('nodes { name }');
    expect(query).toContain('pageInfo { hasNextPage endCursor }');
    expect(query).not.toContain('acme');
    expect(jq).toBe('.data.organization.repositories.nodes[] | select(. != null) | .name');
  });

  it('pages user repository names', () => {
    const { query, jq } = repositoryNamesGraphql({ kind: 'user', login: 'octocat' });
    expect(query).toContain('user(login: $login)');
    expect(query).not.toContain('octocat');
    expect(jq).toBe('.data.user.repositories.nodes[] | select(. != null) | .name');
  });
});

describe('parseRepositoryNameLines', () => {
  it('drops blank lines', () => {
    expect(parseRepositoryNameLines('alpha\n\nbeta\n')).toEqual(['alpha', 'beta']);
  });
});
