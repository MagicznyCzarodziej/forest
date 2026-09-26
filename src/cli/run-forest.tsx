import { render } from "ink";
import { bootstrap } from "../application/bootstrap.js";
import { ConfigError } from "../config/load-config.js";
import { ForestApp } from "../ui/ForestApp.js";

export async function runForest(cwd = process.cwd()): Promise<void> {
  try {
    const data = await bootstrap(cwd);
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
