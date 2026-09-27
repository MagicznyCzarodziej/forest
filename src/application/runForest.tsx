import { render } from 'ink';
import { AppContextProvider, createAppContext } from '../ui/context/AppContext';
import { ConfigError } from '../config/load-config';
import { ForestNavigationProvider } from '../ui/context/ForestNavigationContext';
import { ForestUiProviders } from '../ui/context/ForestUiProviders';
import { ForestScreen } from '../ui/screens/ForestScreen';

export async function runForest(): Promise<void> {
  try {
    const context = await createAppContext(process.cwd());

    const instance = render(
      <AppContextProvider context={context}>
        <ForestNavigationProvider>
          <ForestUiProviders>
            <ForestScreen />
          </ForestUiProviders>
        </ForestNavigationProvider>
      </AppContextProvider>,
      {
        patchConsole: false,
        incrementalRendering: true,
        alternateScreen: true,
      },
    );

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
