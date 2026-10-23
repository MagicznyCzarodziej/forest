import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitHubOwner } from '../../domain/github-owner';

const execFileAsync = promisify(execFile);

export class GitHubRepositoryLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubRepositoryLookupError';
  }
}

export async function gitHubRepositoryExists(
  owner: GitHubOwner,
  repositoryName: string,
): Promise<boolean> {
  try {
    await execFileAsync('gh', ['repo', 'view', `${owner.login}/${repositoryName}`]);
    return true;
  } catch (error) {
    const err = error as { code?: number; stderr?: string | Buffer };
    if (err.code === 1) {
      return false;
    }
    const detail =
      typeof err.stderr === 'string'
        ? err.stderr.trim()
        : err.stderr?.toString().trim() || 'Could not reach GitHub';
    throw new GitHubRepositoryLookupError(detail);
  }
}
