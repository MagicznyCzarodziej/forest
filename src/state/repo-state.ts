import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface RepoState {
  lastOpenedAt?: number;
}

export interface WorktreeState {
  lastUsedAt?: number;
}

export interface RepoStateFile {
  repos: Record<string, RepoState>;
  worktrees: Record<string, WorktreeState>;
}

const emptyState = (): RepoStateFile => ({ repos: {}, worktrees: {} });

export class RepoStateStore {
  constructor(private readonly filePath: string) {}

  static defaultPath(home = process.env.HOME): string {
    if (!home) {
      throw new Error('HOME is not set');
    }
    return join(home, '.config', 'forest', 'state.json');
  }

  async read(): Promise<RepoStateFile> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as RepoStateFile;
      return {
        repos: parsed.repos ?? {},
        worktrees: parsed.worktrees ?? {},
      };
    } catch {
      return emptyState();
    }
  }

  async write(state: RepoStateFile): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8');
  }

  async getRepo(name: string): Promise<RepoState | undefined> {
    const state = await this.read();
    return state.repos[name];
  }

  async touchRepo(name: string, at = Date.now()): Promise<void> {
    const state = await this.read();
    state.repos[name] = { ...state.repos[name], lastOpenedAt: at };
    await this.write(state);
  }

  async touchWorktree(path: string, at = Date.now()): Promise<void> {
    const state = await this.read();
    state.worktrees[path] = { ...state.worktrees[path], lastUsedAt: at };
    await this.write(state);
  }

  async getWorktree(path: string): Promise<WorktreeState | undefined> {
    const state = await this.read();
    return state.worktrees[path];
  }
}
