import type { ScreenState } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';
import { useWorktreeCatalogContext } from '../../context/WorktreeCatalogContext';
import { useWorktreeOperationsContext } from '../../context/WorktreeOperationsContext';
import { WorktreesScreen } from './WorktreesScreen';

interface WorktreesRouteProps {
  screen: Extract<ScreenState, { type: 'worktrees' }>;
}

export function WorktreesRoute({ screen }: WorktreesRouteProps) {
  const { goBack, goToBranches } = useForestNavigation();
  const { worktrees, ready } = useWorktreeCatalogContext();
  const { openingWorktreePath, openWorktree } = useWorktreeOperationsContext();

  return (
    <WorktreesScreen
      key={screen.repositoryPath}
      worktrees={ready ? worktrees : []}
      openingWorktreePath={openingWorktreePath}
      onOpenWorktree={(worktree) =>
        void openWorktree(screen.repositoryName, screen.repositoryPath, worktree)
      }
      onCreateFromQuery={(newBranchName) =>
        goToBranches(screen.repositoryName, screen.repositoryPath, newBranchName)
      }
      onEscape={goBack}
      emptyMessage={ready ? 'No matching worktrees — Enter to create one' : 'Loading…'}
    />
  );
}
