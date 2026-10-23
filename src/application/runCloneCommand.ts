import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { ConfigError, loadConfig } from '../config/load-config';
import { bareRepositoryPath } from '../domain/repositories/repository-structure';
import { RepositoryStateStore } from '../domain/state/repository-state';
import { cloneRepository } from '../infrastructure/git/clone-repository';
import { buildCloneUrl, detectGitProtocol } from '../infrastructure/github/clone-url';

export class CloneCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloneCommandError';
  }
}

export interface RunCloneCommandOptions {
  /** Overrides GitHub URL resolution (used in tests). */
  cloneUrl?: string;
  home?: string;
}

function printConfigHelp(): void {
  console.error('Create ~/.config/forest/config.json with { root, githubOwner: { kind, login } }.');
}

export async function runCloneCommand(
  repositoryName: string,
  options: RunCloneCommandOptions = {},
): Promise<void> {
  const trimmed = repositoryName.trim();
  if (!trimmed) {
    console.error('forest clone: repository name is required');
    process.exitCode = 1;
    return;
  }

  try {
    const config = await loadConfig(options.home);
    const repositoryDir = join(config.root, trimmed);
    const barePath = bareRepositoryPath(repositoryDir);

    try {
      await access(barePath);
      throw new CloneCommandError(`Repository is already cloned at ${repositoryDir}`);
    } catch (error) {
      if (error instanceof CloneCommandError) {
        throw error;
      }
    }

    const cloneUrl =
      options.cloneUrl ?? buildCloneUrl(config.githubOwner, trimmed, await detectGitProtocol());
    const result = await cloneRepository({
      root: config.root,
      repositoryName: trimmed,
      cloneUrl,
      repositoryWorktreeSeparator: config.repositoryWorktreeSeparator,
      onOutput: (line) => {
        console.error(line);
      },
    });

    const stateStore = new RepositoryStateStore(RepositoryStateStore.defaultPath());
    await stateStore.touchRepository(trimmed);

    console.error(`Cloned ${trimmed} (${result.defaultBranch})`);
    console.log(result.defaultWorktreePath);
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`forest: ${error.message}`);
      printConfigHelp();
      process.exitCode = 1;
      return;
    }
    if (error instanceof CloneCommandError) {
      console.error(`forest clone: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}
