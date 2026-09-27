import type { GitHubOwner } from "./github-owner.js";

export type RepoStructure = "standard" | "legacy" | "unknown" | "none";

export interface ForestConfig {
  root: string;
  githubOwner: GitHubOwner;
  /** Between the repo name and branch slug in a worktree folder, such as `repo__master`. */
  repoSlugSeparator: string;
}

export interface LocalRepoMeta {
  name: string;
  path: string;
  structure: Exclude<RepoStructure, "none">;
  lastOpenedAt?: number;
}

export interface RepoCatalogEntry {
  name: string;
  clonedLocally: boolean;
  structure: RepoStructure;
  path?: string;
  lastOpenedAt?: number;
}

export interface WorktreeEntry {
  name: string;
  path: string;
  branch: string;
  isDefaultBranch: boolean;
  lastUsedAt?: number;
}
