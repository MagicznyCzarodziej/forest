import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface RepositoryState {
  lastOpenedAt?: number;
}

export interface WorktreeState {
  lastUsedAt?: number;
}

export interface RepositoryStateFile {
  repositories: Record<string, RepositoryState>;
  worktrees: Record<string, WorktreeState>;
}

const emptyState = (): RepositoryStateFile => ({ repositories: {}, worktrees: {} });

export class RepositoryStateStore {
  constructor(private readonly filePath: string) {}

  static defaultPath(home = process.env.HOME): string {
    if (!home) {
      throw new Error('HOME is not set');
    }
    return join(home, '.config', 'forest', 'state.json');
  }

  async read(): Promise<RepositoryStateFile> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as RepositoryStateFile;
      return {
        repositories: parsed.repositories ?? {},
        worktrees: parsed.worktrees ?? {},
      };
    } catch {
      return emptyState();
    }
  }

  async write(state: RepositoryStateFile): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8');
  }

  async getRepository(name: string): Promise<RepositoryState | undefined> {
    const state = await this.read();
    return state.repositories[name];
  }

  async touchRepository(name: string, at = Date.now()): Promise<void> {
    const state = await this.read();
    state.repositories[name] = { ...state.repositories[name], lastOpenedAt: at };
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
