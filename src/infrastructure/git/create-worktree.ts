import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  bareRepositoryPath,
  worktreeFolderName,
} from '../../domain/repositories/repository-structure';
import { branchToWorktreeSlug } from './branchToPath';
import { repositoryHasCommits, type GitOutputHandler } from './default-branch';
import { runGitStreaming } from './run-git';

export interface CreateWorktreeResult {
  worktreePath: string;
  branch: string;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function createWorktreeFromBare(input: {
  repositoryPath: string;
  repositoryName: string;
  /** Name of the branch and worktree folder to create. */
  newBranchName: string;
  /** Existing branch the new branch starts from. */
  baseBranch: string;
  repositoryWorktreeSeparator?: string;
  onOutput: GitOutputHandler;
}): Promise<CreateWorktreeResult> {
  const barePath = bareRepositoryPath(input.repositoryPath);
  const worktree = branchToWorktreeSlug(input.newBranchName);
  const worktreePath = join(
    input.repositoryPath,
    worktreeFolderName(input.repositoryName, worktree, input.repositoryWorktreeSeparator),
  );

  if (await pathExists(worktreePath)) {
    throw new Error(`Worktree folder already exists: ${worktreePath}`);
  }

  if (!(await repositoryHasCommits(barePath))) {
    input.onOutput(
      `${input.baseBranch} has no commits yet. Creating empty worktree ${input.newBranchName}`,
    );
    await runGitStreaming(['init', '-b', input.newBranchName, worktreePath], {
      onOutput: input.onOutput,
    });
    await runGitStreaming(['remote', 'add', 'origin', barePath], {
      cwd: worktreePath,
      onOutput: input.onOutput,
    });
    return { worktreePath, branch: input.newBranchName };
  }

  input.onOutput(`Fetching ${input.baseBranch}…`);
  await runGitStreaming(['-C', barePath, 'fetch', 'origin', input.baseBranch, '--progress'], {
    onOutput: input.onOutput,
  });

  input.onOutput(`Cloning ${input.baseBranch} into ${worktreePath}`);
  await runGitStreaming(
    ['clone', '--branch', input.baseBranch, '--progress', barePath, worktreePath],
    { onOutput: input.onOutput },
  );

  input.onOutput(`Creating branch ${input.newBranchName} from ${input.baseBranch}`);
  await runGitStreaming(['checkout', '-b', input.newBranchName], {
    cwd: worktreePath,
    onOutput: input.onOutput,
  });

  return { worktreePath, branch: input.newBranchName };
}
