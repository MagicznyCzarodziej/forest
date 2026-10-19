import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { withGitHubCredentials } from '../github/clone-url';
import type { GitOutputHandler } from './default-branch';
import { runGitStreaming } from './run-git';

const execFileAsync = promisify(execFile);

export async function readOriginUrl(barePath: string): Promise<string> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync('git', ['-C', barePath, 'remote', 'get-url', 'origin']));
  } catch (cause) {
    throw new Error(`Bare repository has no origin remote: ${barePath}`, { cause });
  }

  const originUrl = stdout.trim();
  if (!originUrl) {
    throw new Error(`Bare repository has no origin URL: ${barePath}`);
  }
  return originUrl;
}

export async function fetchOriginBranches(
  barePath: string,
  onOutput?: GitOutputHandler,
): Promise<void> {
  let originUrl: string;
  try {
    originUrl = await readOriginUrl(barePath);
  } catch {
    return;
  }

  // Forest bare clones often have no `remote.origin.fetch`; explicit refspecs
  // populate remote-tracking refs for the branch picker and keep refs/heads current.
  await runGitStreaming(
    withGitHubCredentials(originUrl, [
      '-C',
      barePath,
      'fetch',
      'origin',
      '--prune',
      '--progress',
      '+refs/heads/*:refs/remotes/origin/*',
      '+refs/heads/*:refs/heads/*',
    ]),
    { onOutput },
  );
}
