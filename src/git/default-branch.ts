import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Used when a repository does not record a default branch. */
export const DEFAULT_BRANCH = "master";

export type GitOutputHandler = (line: string) => void;

async function runGit(
  args: string[],
  cwd?: string,
  onOutput?: GitOutputHandler,
): Promise<string> {
  const { stdout, stderr } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 20 * 1024 * 1024,
  });
  const out = `${stdout}${stderr}`.trim();
  if (onOutput && out) {
    for (const line of out.split("\n")) {
      onOutput(line);
    }
  }
  return stdout.trim();
}

export async function detectDefaultBranchFromRemote(
  cloneUrl: string,
  onOutput?: GitOutputHandler,
): Promise<string> {
  const out = await runGit(
    ["ls-remote", "--symref", cloneUrl, "HEAD"],
    undefined,
    onOutput,
  );
  const match = out.match(/ref: refs\/heads\/(\S+)\s+HEAD/);
  if (match?.[1]) {
    return match[1];
  }
  return DEFAULT_BRANCH;
}

export async function detectDefaultBranchFromBare(
  barePath: string,
  onOutput?: GitOutputHandler,
): Promise<string> {
  try {
    // Bare clones store their default branch in HEAD (for example,
    // refs/heads/master), not necessarily in refs/remotes/origin/HEAD.
    const headBranch = await runGit(["symbolic-ref", "--short", "HEAD"], barePath, onOutput);
    if (headBranch) {
      return headBranch;
    }
  } catch {
    // Fall through to remote-tracking HEAD for non-standard bare repositories.
  }

  try {
    const sym = await runGit(
      ["symbolic-ref", "refs/remotes/origin/HEAD"],
      barePath,
      onOutput,
    );
    const match = sym.match(/refs\/remotes\/origin\/(.+)/);
    if (match?.[1]) {
      return match[1];
    }
  } catch {
    // fall through
  }
  return DEFAULT_BRANCH;
}

/** Branch name stored in a `.git/HEAD` file, such as `ref: refs/heads/master`. */
export function branchFromHead(head: string): string | null {
  const match = head.match(/^ref: refs\/heads\/(\S+)/);
  return match?.[1] ?? null;
}

/**
 * Checked-out branch. `rev-parse HEAD` fails when the repository has no commits,
 * so an unborn branch is read from `symbolic-ref` or `.git/HEAD` instead.
 */
export async function detectCurrentBranch(
  repoPath: string,
  onOutput?: GitOutputHandler,
): Promise<string> {
  try {
    const branch = await runGit(["symbolic-ref", "--short", "HEAD"], repoPath, onOutput);
    if (branch) {
      return branch;
    }
  } catch {
    // Detached HEAD has no symbolic ref.
  }

  const fromFile = await readCheckedOutBranch(repoPath);
  if (fromFile) {
    return fromFile;
  }

  const branch = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], repoPath, onOutput);
  if (!branch || branch === "HEAD") {
    throw new Error("Could not determine the checked-out branch");
  }
  return branch;
}

export async function repositoryHasCommits(repoPath: string): Promise<boolean> {
  try {
    await execFileAsync("git", ["rev-parse", "--verify", "--quiet", "HEAD"], {
      cwd: repoPath,
    });
    return true;
  } catch {
    return false;
  }
}

async function readCheckedOutBranch(repoPath: string): Promise<string | null> {
  const gitPath = join(repoPath, ".git");
  let headPath = join(gitPath, "HEAD");
  try {
    const gitMeta = await readFile(gitPath, "utf8");
    if (gitMeta.startsWith("gitdir:")) {
      const gitDir = gitMeta.slice("gitdir:".length).trim();
      headPath = join(isAbsolute(gitDir) ? gitDir : join(repoPath, gitDir), "HEAD");
    }
  } catch {
    // `.git` is a directory.
  }

  try {
    return branchFromHead(await readFile(headPath, "utf8"));
  } catch {
    return null;
  }
}
