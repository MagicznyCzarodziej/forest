import { spawn } from 'node:child_process';
import type { GitOutputHandler } from './default-branch';

export async function runGitStreaming(
  args: string[],
  options: { cwd?: string; onOutput?: GitOutputHandler } = {},
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('git', args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const emit = (chunk: Buffer) => {
      const text = chunk.toString();
      for (const line of text.split(/\r?\n/)) {
        const payload = line.includes('\r') ? line.slice(line.lastIndexOf('\r') + 1) : line;
        if (payload.trim()) {
          options.onOutput?.(payload);
        }
      }
    };

    child.stdout?.on('data', emit);
    child.stderr?.on('data', emit);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`git ${args.join(' ')} failed with code ${code}`));
      }
    });
  });
}
