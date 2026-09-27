import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitHubOwner } from '../domain/github-owner';

const execFileAsync = promisify(execFile);

const NAME_LIST_MAX_BUFFER = 10 * 1024 * 1024;

export interface GitHubRepoListProvider {
  listRepoNames(owner: GitHubOwner): Promise<string[]>;
}

export function repoNamesGraphql(owner: GitHubOwner): { query: string; jq: string } {
  const root = owner.kind === 'organization' ? 'organization' : 'user';
  const query = [
    'query($login: String!, $endCursor: String) {',
    `  ${root}(login: $login) {`,
    '    repositories(first: 100, after: $endCursor, orderBy: {field: NAME, direction: ASC}) {',
    '      nodes { name }',
    '      pageInfo { hasNextPage endCursor }',
    '    }',
    '  }',
    '}',
  ].join('\n');
  const jq = `.data.${root}.repositories.nodes[] | select(. != null) | .name`;
  return { query, jq };
}

export function parseRepoNameLines(stdout: string): string[] {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export class GhCliRepoListProvider implements GitHubRepoListProvider {
  async listRepoNames(owner: GitHubOwner): Promise<string[]> {
    const { query, jq } = repoNamesGraphql(owner);
    const { stdout } = await execFileAsync(
      'gh',
      [
        'api',
        'graphql',
        '--paginate',
        '-f',
        `login=${owner.login}`,
        '-f',
        `query=${query}`,
        '--jq',
        jq,
      ],
      { maxBuffer: NAME_LIST_MAX_BUFFER },
    );
    return parseRepoNameLines(stdout);
  }
}
