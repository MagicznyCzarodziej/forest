import { useForestNavigation } from '../../context/ForestNavigationContext';
import { BranchesRoute } from './BranchesRoute';
import { ConfirmCloneRoute } from './ConfirmCloneRoute';
import { ConfirmConvertRoute } from './ConfirmConvertRoute';
import { ProgressRoute } from './ProgressRoute';
import { RepositoriesRoute } from './RepositoriesRoute';
import { WorktreesRoute } from './WorktreesRoute';

export function ScreenRouter() {
  const { screen } = useForestNavigation();

  switch (screen.type) {
    case 'repositories':
      return <RepositoriesRoute />;
    case 'worktrees':
      return <WorktreesRoute screen={screen} />;
    case 'branches':
      return <BranchesRoute screen={screen} />;
    case 'confirm-clone':
      return <ConfirmCloneRoute screen={screen} />;
    case 'confirm-convert':
      return <ConfirmConvertRoute screen={screen} />;
    case 'progress':
      return <ProgressRoute screen={screen} />;
  }
}
