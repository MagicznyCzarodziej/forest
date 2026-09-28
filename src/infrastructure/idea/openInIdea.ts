import { spawn } from 'node:child_process';

export function openInIdea(projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('idea', [projectPath], { stdio: 'ignore', detached: true });
    child.on('error', reject);
    child.on('spawn', () => {
      child.unref();
      resolve();
    });
  });
}
