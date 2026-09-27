import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';
import { currentScreen, popScreen, pushScreen, type ScreenState } from '../navigation/navigation';
import { initialStack } from '../navigation/initialStack';
import { useForest } from '../hooks/useForest';

export interface ForestNavigationContextValue {
  screen: ScreenState;
  goBack: () => void;
  goToBranches: (repositoryName: string, repositoryPath: string, newBranchName: string) => void;
  setStack: Dispatch<SetStateAction<ScreenState[]>>;
}

const ForestNavigationContext = createContext<ForestNavigationContextValue | null>(null);

export function ForestNavigationProvider({ children }: PropsWithChildren) {
  const { startContext } = useForest();
  const [stack, setStack] = useState(() => initialStack(startContext));
  const screen = currentScreen(stack);

  const goBack = useCallback(() => {
    setStack((current) => popScreen(current));
  }, []);

  const goToBranches = useCallback(
    (repositoryName: string, repositoryPath: string, newBranchName: string) => {
      setStack((current) =>
        pushScreen(current, {
          type: 'branches',
          repositoryName,
          repositoryPath,
          newBranchName,
        }),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({ screen, goBack, goToBranches, setStack }),
    [screen, goBack, goToBranches],
  );

  return <ForestNavigationContext value={value}>{children}</ForestNavigationContext>;
}

export function useForestNavigation() {
  const navigation = use(ForestNavigationContext);
  if (navigation === null) {
    throw new Error('useForestNavigation must be used within ForestNavigationProvider');
  }
  return navigation;
}
