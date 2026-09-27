import { useForestNavigation } from '../../context/ForestNavigationContext';
import { useRepositoryListContext } from '../../context/RepositoryListContext';
import { useRepositoryOperationsContext } from '../../context/RepositoryOperationsContext';
import { RepositoriesScreen } from './RepositoriesScreen';

export function RepositoriesRoute() {
  const { goBack } = useForestNavigation();
  const { repositories, githubListStatus } = useRepositoryListContext();
  const { openRepository } = useRepositoryOperationsContext();

  return (
    <RepositoriesScreen
      repositories={repositories}
      onSelect={(repository) => void openRepository(repository)}
      onEscape={goBack}
      emptyMessage={githubListStatus === 'loading' ? 'Loading from GitHub…' : undefined}
    />
  );
}
