export type GitHubOwnerKind = 'organization' | 'user';

export interface GitHubOwner {
  kind: GitHubOwnerKind;
  login: string;
}

export function githubOwnerCacheKey(owner: GitHubOwner): string {
  return `${owner.kind}:${owner.login}`;
}
