import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { bareRepoPath, worktreeFolderName } from "../repos/repo-structure.js";
import {
  detectCurrentBranch,
  detectDefaultBranchFromBare,
  repositoryHasCommits,
  type GitOutputHandler,
} from "./default-branch.js";
import { runGitStreaming } from "./run-git.js";

async function moveRootIntoWorktree(
  repoPath: string,
  worktreePath: string,
  reserved: Set<string>,
  onOutput: GitOutputHandler,
): Promise<void> {
  await mkdir(worktreePath, { recursive: true });
  const entries = await readdir(repoPath);
  for (const entry of entries) {
    if (reserved.has(entry)) {
      continue;
    }
    onOutput(`Moving ${entry} → worktree`);
    await rename(join(repoPath, entry), join(worktreePath, entry));
  }
}

export interface ConvertRepositoryResult {
  defaultBranch: string;
  currentBranch: string;
}

export async function convertLegacyRepository(input: {
  repoPath: string;
  repoName: string;
  onOutput: GitOutputHandler;
}): Promise<ConvertRepositoryResult> {
  const currentBranch = await detectCurrentBranch(input.repoPath, input.onOutput);
  if (!(await repositoryHasCommits(input.repoPath))) {
    return convertUnbornRepository(input, currentBranch);
  }

  const barePath = bareRepoPath(input.repoPath);

  input.onOutput(`Creating bare repository at ${barePath}`);
  await runGitStreaming(["clone", "--bare", ".", barePath], {
    cwd: input.repoPath,
    onOutput: input.onOutput,
  });

  input.onOutput("Removing legacy .git directory");
  await rm(join(input.repoPath, ".git"), { recursive: true, force: true });

  const defaultBranch = await detectDefaultBranchFromBare(barePath, input.onOutput);
  const reserved = new Set<string>([".bare"]);

  if (currentBranch === defaultBranch) {
    const folder = worktreeFolderName(input.repoName, currentBranch);
    const wtPath = join(input.repoPath, folder);
    reserved.add(folder);
    await moveRootIntoWorktree(input.repoPath, wtPath, reserved, input.onOutput);
    input.onOutput(`Registering worktree for ${defaultBranch}`);
    await runGitStreaming(
      ["-C", barePath, "worktree", "add", "--force", wtPath, defaultBranch],
      { onOutput: input.onOutput },
    );
  } else {
    const currentFolder = worktreeFolderName(input.repoName, currentBranch);
    const currentWt = join(input.repoPath, currentFolder);
    reserved.add(currentFolder);
    await moveRootIntoWorktree(input.repoPath, currentWt, reserved, input.onOutput);
    input.onOutput(`Registering worktree for ${currentBranch}`);
    await runGitStreaming(
      ["-C", barePath, "worktree", "add", "--force", currentWt, currentBranch],
      { onOutput: input.onOutput },
    );

    const defaultFolder = worktreeFolderName(input.repoName, defaultBranch);
    const defaultWt = join(input.repoPath, defaultFolder);
    input.onOutput(`Cloning ${defaultBranch} into ${defaultWt}`);
    await runGitStreaming(
      ["clone", "--branch", defaultBranch, "--progress", barePath, defaultWt],
      { onOutput: input.onOutput },
    );
  }

  return { defaultBranch, currentBranch };
}

/** A repository with no commits cannot be bare-cloned. Keep its index and files. */
async function convertUnbornRepository(
  input: {
    repoPath: string;
    repoName: string;
    onOutput: GitOutputHandler;
  },
  currentBranch: string,
): Promise<ConvertRepositoryResult> {
  const barePath = bareRepoPath(input.repoPath);
  const folder = worktreeFolderName(input.repoName, currentBranch);
  const worktreePath = join(input.repoPath, folder);

  input.onOutput(`No commits yet on ${currentBranch}`);
  input.onOutput(`Creating bare repository at ${barePath}`);
  await runGitStreaming(["init", "--bare", "-b", currentBranch, barePath], {
    onOutput: input.onOutput,
  });

  input.onOutput(`Moving the working tree into ${folder}`);
  await moveRootIntoWorktree(
    input.repoPath,
    worktreePath,
    new Set([".bare", folder]),
    input.onOutput,
  );
  await runGitStreaming(["remote", "add", "origin", barePath], {
    cwd: worktreePath,
    onOutput: input.onOutput,
  });

  return { defaultBranch: currentBranch, currentBranch };
}
