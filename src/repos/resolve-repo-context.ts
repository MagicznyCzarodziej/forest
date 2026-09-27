import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { basename } from 'node:path';
import type { RepoContext } from './detect-context.js';
import { isPathInside } from '../utils/paths.js';

const execFileAsync = promisify(execFile);

export async function resolveRepoContextFromCwd(
  cwd: string,
  root: string,
): Promise<RepoContext | null> {
  if (!isPathInside(root, cwd)) {
    return null;
  }

  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
    });
    const repoPath = stdout.trim();
    if (!isPathInside(root, repoPath)) {
      return null;
    }
    return {
      repoName: basename(repoPath),
      repoPath,
    };
  } catch {
    return null;
  }
}
