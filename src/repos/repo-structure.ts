import { join } from "node:path";
import type { RepoStructure } from "../domain/types.js";
import { branchToWorktreeSlug } from "../git/branch-slug.js";

export const DEFAULT_REPO_SLUG_SEPARATOR = "__";

export function worktreeFolderName(
  repoName: string,
  branchOrSlug: string,
  separator = DEFAULT_REPO_SLUG_SEPARATOR,
): string {
  const slug = branchOrSlug.includes("/") ? branchToWorktreeSlug(branchOrSlug) : branchOrSlug;
  return `${repoName}${separator}${slug}`;
}

export function bareRepoPath(repoPath: string): string {
  return join(repoPath, ".bare");
}

export function defaultWorktreePath(
  repoPath: string,
  repoName: string,
  defaultBranch: string,
  separator = DEFAULT_REPO_SLUG_SEPARATOR,
): string {
  return join(repoPath, worktreeFolderName(repoName, defaultBranch, separator));
}

export interface DetectRepoStructureInput {
  repoPath: string;
  repoName: string;
  hasBareDir: boolean;
  hasRootGit?: boolean;
  childDirNames: string[];
  defaultBranch: string;
  repoSlugSeparator?: string;
}

export function detectRepoStructure(input: DetectRepoStructureInput): RepoStructure {
  const expectedDefault = worktreeFolderName(
    input.repoName,
    input.defaultBranch,
    input.repoSlugSeparator,
  );
  if (input.hasBareDir && input.childDirNames.includes(expectedDefault)) {
    return "standard";
  }
  if (input.hasRootGit && !input.hasBareDir) {
    return "legacy";
  }
  if (input.hasBareDir) {
    return "standard";
  }
  return "unknown";
}
