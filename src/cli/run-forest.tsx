import { render } from 'ink';
import { bootstrap } from '../application/bootstrap';
import { ConfigError } from '../config/load-config';
import { ForestApp } from '../ui/ForestApp';

export async function runForest(): Promise<void> {
  try {
    const data = await bootstrap(process.cwd());
    const instance = render(<ForestApp bootstrap={data} />, {
      patchConsole: false,
      incrementalRendering: true,
      /** Separate buffer: no scrollback growth while the UI is open (vim/htop-style). */
      alternateScreen: true,
    });
    await instance.waitUntilExit();
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`forest: ${error.message}`);
      console.error(
        'Create ~/.config/forest/config.json with { root, githubOwner: { kind, login } }.',
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}
