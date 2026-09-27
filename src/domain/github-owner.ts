export type GitHubOwnerKind = 'organization' | 'user';

export interface GitHubOwner {
  kind: GitHubOwnerKind;
  login: string;
}

export function githubOwnerCacheKey(owner: GitHubOwner): string {
  return `${owner.kind}:${owner.login}`;
}

export function formatGitHubOwner(owner: GitHubOwner): string {
  return owner.kind === 'organization' ? `org:${owner.login}` : `user:${owner.login}`;
}
