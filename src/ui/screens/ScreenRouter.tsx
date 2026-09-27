import { useForestNavigation } from '../context/ForestNavigationContext';
import { BranchesRoute } from './BranchesScreen/BranchesRoute';
import { ConfirmCloneRoute } from './ConfirmCloneScreen/ConfirmCloneRoute';
import { ConfirmConvertRoute } from './ConfirmConvertScreen/ConfirmConvertRoute';
import { ProgressRoute } from './ProgressScreen/ProgressRoute';
import { RepositoriesRoute } from './RepositoriesScreen/RepositoriesRoute';
import { WorktreesRoute } from './WorktreesScreen/WorktreesRoute';

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
