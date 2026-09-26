import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { GitHubOwner } from "../domain/github-owner.js";

const execFileAsync = promisify(execFile);

export interface GitHubRepoListProvider {
  listRepoNames(owner: GitHubOwner): Promise<string[]>;
}

export function listReposApiPath(owner: GitHubOwner): string {
  switch (owner.kind) {
    case "organization":
      return `orgs/${owner.login}/repos`;
    case "user":
      return `users/${owner.login}/repos`;
  }
}

export class GhCliRepoListProvider implements GitHubRepoListProvider {
  async listRepoNames(owner: GitHubOwner): Promise<string[]> {
    const { stdout } = await execFileAsync(
      "gh",
      ["api", listReposApiPath(owner), "--paginate", "-q", ".[].name"],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
}
