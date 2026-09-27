import { useForestNavigation } from '../../context/ForestNavigationContext';
import { useForestOperationsContext } from '../../context/ForestOperationsContext';
import { RepositoriesScreen } from './RepositoriesScreen';

export function RepositoriesRoute() {
  const { goBack } = useForestNavigation();
  const { repositories, githubListStatus, openRepository } = useForestOperationsContext();

  return (
    <RepositoriesScreen
      repositories={repositories}
      onSelect={(repository) => void openRepository(repository)}
      onEscape={goBack}
      emptyMessage={githubListStatus === 'loading' ? 'Loading from GitHub…' : undefined}
    />
  );
}
