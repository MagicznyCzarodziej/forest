import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitHubOwner } from '../domain/github-owner';

const execFileAsync = promisify(execFile);

export type GitProtocol = 'https' | 'ssh';

export function buildCloneUrl(
  owner: GitHubOwner,
  repositoryName: string,
  protocol: GitProtocol = 'https',
): string {
  if (protocol === 'ssh') {
    return `git@github.com:${owner.login}/${repositoryName}.git`;
  }
  return `https://github.com/${owner.login}/${repositoryName}.git`;
}

/** HTTPS clones use the `gh` token, which can read private repositories. */
export function withGitHubCredentials(cloneUrl: string, args: string[]): string[] {
  if (!cloneUrl.startsWith('https://github.com/')) {
    return args;
  }
  return [
    '-c',
    'credential.https://github.com.helper=',
    '-c',
    'credential.https://github.com.helper=!gh auth git-credential',
    ...args,
  ];
}

export async function detectGitProtocol(): Promise<GitProtocol> {
  try {
    const { stdout } = await execFileAsync('gh', ['config', 'get', 'git_protocol']);
    return stdout.trim() === 'ssh' ? 'ssh' : 'https';
  } catch {
    return 'https';
  }
}
