import type { ScreenState } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';
import { useForestOperationsContext } from '../../context/ForestOperationsContext';
import { WorktreesScreen } from './WorktreesScreen';

interface WorktreesRouteProps {
  screen: Extract<ScreenState, { type: 'worktrees' }>;
}

export function WorktreesRoute({ screen }: WorktreesRouteProps) {
  const { goBack, goToBranches } = useForestNavigation();
  const { worktrees, ready, openingWorktreePath, openWorktree } = useForestOperationsContext();

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
