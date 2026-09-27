import type { ScreenState } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';
import { useWorktreeCatalogContext } from '../../context/WorktreeCatalogContext';
import { useWorktreeOperationsContext } from '../../context/WorktreeOperationsContext';
import { BranchesScreen } from './BranchesScreen';

// Separator that won't appear in file paths or branch names
const NULL_SEPARATOR = '\0';

interface BranchesRouteProps {
  screen: Extract<ScreenState, { type: 'branches' }>;
}

export function BranchesRoute({ screen }: BranchesRouteProps) {
  const { goBack } = useForestNavigation();
  const { branches, ready } = useWorktreeCatalogContext();
  const { createWorktree } = useWorktreeOperationsContext();

  return (
    <BranchesScreen
      key={`${screen.repositoryPath}${NULL_SEPARATOR}${screen.newBranchName}`}
      branches={ready ? branches : []}
      emptyMessage={ready ? 'No matching branches' : 'Loading…'}
      onSelectBranch={(baseBranch) =>
        void createWorktree(
          screen.repositoryName,
          screen.repositoryPath,
          screen.newBranchName,
          baseBranch,
        )
      }
      onEscape={goBack}
    />
  );
}
