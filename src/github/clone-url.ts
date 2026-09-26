import type { GitHubOwner } from "../domain/github-owner.js";

export function buildCloneUrl(owner: GitHubOwner, repoName: string): string {
  return `git@github.com:${owner.login}/${repoName}.git`;
}
