import { useState } from 'react';
import { popScreen, pushScreen, currentScreen } from './navigation/screen-stack';
import { useForestOperations } from './hooks/useForestOperations';
import { useWorktreeCatalog } from './hooks/useWorktreeCatalog';
import { useForest } from './hooks/useForest';
import { initialStack } from './navigation/initial-stack';
import { ForestScreen } from './screens/ForestScreen';

export function ForestApp() {
  const { startContext } = useForest();
  const [stack, setStack] = useState(() => initialStack(startContext));
  const screen = currentScreen(stack);
  const worktreeCatalog = useWorktreeCatalog(screen);
  const operations = useForestOperations({
    setStack,
    worktreeCatalog,
  });

  const goBack = () => setStack((current) => popScreen(current));

  const showBranches = (repositoryName: string, repositoryPath: string, newBranchName: string) => {
    setStack((current) =>
      pushScreen(current, {
        type: 'branches',
        repositoryName,
        repositoryPath,
        newBranchName,
      }),
    );
  };

  return (
    <ForestScreen
      screen={screen}
      repositories={operations.repositories}
      githubListStatus={operations.githubListStatus}
      worktrees={worktreeCatalog.worktrees}
      branches={worktreeCatalog.branches}
      catalogReady={worktreeCatalog.ready}
      openingWorktreePath={operations.openingWorktreePath}
      progressLines={operations.progressLines}
      actions={operations}
      onShowBranches={showBranches}
      onBack={goBack}
    />
  );
}
