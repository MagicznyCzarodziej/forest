import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ForestConfig } from '../domain/types';
import { DEFAULT_REPO_SLUG_SEPARATOR } from '../repos/repo-structure';
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

export function remoteRepoCachePath(home = process.env.HOME): string {
  if (!home) {
    throw new ConfigError('HOME is not set');
  }
  return join(home, '.config', 'forest', 'remote-repos-cache.json');
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
    repoSlugSeparator: parseRepoSlugSeparator(record.repoSlugSeparator),
  };
}

function parseRepoSlugSeparator(value: unknown): string {
  if (value === undefined) {
    return DEFAULT_REPO_SLUG_SEPARATOR;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new ConfigError('Config field "repoSlugSeparator" must be a non-empty string');
  }
  if (value.includes('/') || value.includes('\\')) {
    throw new ConfigError('Config field "repoSlugSeparator" cannot contain a path separator');
  }
  return value;
}
