import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig, ConfigError } from '../../src/config/load-config.js';

const originalHome = process.env.HOME;

afterEach(() => {
  process.env.HOME = originalHome;
});

describe('loadConfig', () => {
  it('parses root and github owner from config file', async () => {
    const home = await mkdtemp(join(tmpdir(), 'forest-home-'));
    process.env.HOME = home;
    await mkdir(join(home, '.config', 'forest'), { recursive: true });
    await writeFile(
      join(home, '.config', 'forest', 'config.json'),
      JSON.stringify({
        root: '/Users/dev',
        githubOwner: { kind: 'organization', login: 'acme-corp' },
      }),
    );

    const config = await loadConfig();
    expect(config.root).toMatch(/\/dev$/);
    expect(config.githubOwner).toEqual({ kind: 'organization', login: 'acme-corp' });
    expect(config.repoSlugSeparator).toBe('__');
  });

  it('reads a custom repo slug separator', async () => {
    const home = await mkdtemp(join(tmpdir(), 'forest-home-'));
    process.env.HOME = home;
    await mkdir(join(home, '.config', 'forest'), { recursive: true });
    await writeFile(
      join(home, '.config', 'forest', 'config.json'),
      JSON.stringify({
        root: '/Users/dev',
        githubOwner: { kind: 'user', login: 'octocat' },
        repoSlugSeparator: '--',
      }),
    );

    const config = await loadConfig();
    expect(config.repoSlugSeparator).toBe('--');
  });

  it('throws ConfigError when config file is missing', async () => {
    const home = await mkdtemp(join(tmpdir(), 'forest-home-'));
    process.env.HOME = home;
    await expect(loadConfig()).rejects.toBeInstanceOf(ConfigError);
  });

  it('throws ConfigError when github owner is missing', async () => {
    const home = await mkdtemp(join(tmpdir(), 'forest-home-'));
    process.env.HOME = home;
    await mkdir(join(home, '.config', 'forest'), { recursive: true });
    await writeFile(join(home, '.config', 'forest', 'config.json'), JSON.stringify({ root: '/x' }));

    await expect(loadConfig()).rejects.toBeInstanceOf(ConfigError);
  });
});
