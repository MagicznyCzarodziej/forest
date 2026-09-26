import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { bareRepoPath, defaultWorktreePath as worktreePathForBranch } from "../repos/repo-structure.js";
import { detectDefaultBranchFromRemote } from "./default-branch.js";
import type { GitOutputHandler } from "./default-branch.js";
import { runGitStreaming } from "./run-git.js";

export interface CloneRepositoryResult {
  repoDir: string;
  barePath: string;
  defaultWorktreePath: string;
  defaultBranch: string;
}

export async function cloneRepository(input: {
  root: string;
  repoName: string;
  cloneUrl: string;
  onOutput: GitOutputHandler;
}): Promise<CloneRepositoryResult> {
  const repoDir = join(input.root, input.repoName);
  const barePath = bareRepoPath(repoDir);

  input.onOutput(`Resolving default branch for ${input.repoName}…`);
  const defaultBranch = await detectDefaultBranchFromRemote(input.cloneUrl, input.onOutput);

  input.onOutput(`Creating ${repoDir}`);
  await mkdir(repoDir, { recursive: true });

  input.onOutput(`Cloning bare into ${barePath}`);
  await runGitStreaming(["clone", "--bare", "--progress", input.cloneUrl, barePath], {
    onOutput: input.onOutput,
  });

  const defaultWtPath = worktreePathForBranch(repoDir, input.repoName, defaultBranch);

  input.onOutput(`Cloning ${defaultBranch} into ${defaultWtPath}`);
  await runGitStreaming(
    ["clone", "--branch", defaultBranch, "--progress", barePath, defaultWtPath],
    { onOutput: input.onOutput },
  );

  return {
    repoDir,
    barePath,
    defaultWorktreePath: defaultWtPath,
    defaultBranch,
  };
}
