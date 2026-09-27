import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { withGitHubCredentials } from '../github/clone-url';
import {
  bareRepositoryPath,
  defaultWorktreePath as worktreePathForBranch,
} from '../repositories/repository-structure';
import { detectDefaultBranchFromRemote } from './default-branch';
import type { GitOutputHandler } from './default-branch';
import { runGitStreaming } from './run-git';

export interface CloneRepositoryResult {
  repositoryDir: string;
  barePath: string;
  defaultWorktreePath: string;
  defaultBranch: string;
}

export async function cloneRepository(input: {
  root: string;
  repositoryName: string;
  cloneUrl: string;
  repositoryWorktreeSeparator?: string;
  onOutput: GitOutputHandler;
}): Promise<CloneRepositoryResult> {
  const repositoryDir = join(input.root, input.repositoryName);
  const barePath = bareRepositoryPath(repositoryDir);

  input.onOutput(`Resolving default branch for ${input.repositoryName}…`);
  const defaultBranch = await detectDefaultBranchFromRemote(input.cloneUrl, input.onOutput);

  input.onOutput(`Creating ${repositoryDir}`);
  await mkdir(repositoryDir, { recursive: true });

  input.onOutput(`Cloning bare into ${barePath}`);
  await runGitStreaming(
    withGitHubCredentials(input.cloneUrl, [
      'clone',
      '--bare',
      '--progress',
      input.cloneUrl,
      barePath,
    ]),
    { onOutput: input.onOutput },
  );

  const defaultWtPath = worktreePathForBranch(
    repositoryDir,
    input.repositoryName,
    defaultBranch,
    input.repositoryWorktreeSeparator,
  );

  input.onOutput(`Cloning ${defaultBranch} into ${defaultWtPath}`);
  await runGitStreaming(
    ['clone', '--branch', defaultBranch, '--progress', barePath, defaultWtPath],
    { onOutput: input.onOutput },
  );

  return {
    repositoryDir,
    barePath,
    defaultWorktreePath: defaultWtPath,
    defaultBranch,
  };
}
