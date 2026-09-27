import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ForestConfig } from '../domain/types';
import { DEFAULT_REPOSITORY_WORKTREE_SEPARATOR } from '../repositories/repository-structure';
import { expandPath } from '../utils/expand-path';
import { ConfigError } from './config-error';
import { parseGitHubOwnerFromConfig } from './parse-github-owner';

export { ConfigError } from './config-error';

export function configPath(home = process.env.HOME): string {
  if (!home) {
    throw new ConfigError('HOME is not set');
  }
  return join(home, '.config', 'forest', 'config.json');
}

export function remoteRepositoryCachePath(home = process.env.HOME): string {
  if (!home) {
    throw new ConfigError('HOME is not set');
  }
  return join(home, '.config', 'forest', 'remote-repositories-cache.json');
}

export async function loadConfig(home = process.env.HOME): Promise<ForestConfig> {
  const path = configPath(home);
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    throw new ConfigError(`Config not found at ${path}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigError('Config file is not valid JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ConfigError('Config must be a JSON object');
  }

  const record = parsed as Record<string, unknown>;
  const root = record.root;
  if (typeof root !== 'string' || !root.trim()) {
    throw new ConfigError('Config field "root" must be a non-empty string');
  }

  const githubOwner = parseGitHubOwnerFromConfig(record);

  return {
    root: expandPath(root.trim(), home),
    githubOwner,
    repositoryWorktreeSeparator: parseRepositoryWorktreeSeparator(
      record.repositoryWorktreeSeparator,
    ),
  };
}

function parseRepositoryWorktreeSeparator(value: unknown): string {
  if (value === undefined) {
    return DEFAULT_REPOSITORY_WORKTREE_SEPARATOR;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new ConfigError('Config field "repositoryWorktreeSeparator" must be a non-empty string');
  }
  if (value.includes('/') || value.includes('\\')) {
    throw new ConfigError(
      'Config field "repositoryWorktreeSeparator" cannot contain a path separator',
    );
  }
  return value;
}
