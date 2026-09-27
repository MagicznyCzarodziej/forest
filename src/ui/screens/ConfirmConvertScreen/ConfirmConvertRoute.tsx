import type { ScreenState } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';
import { useRepositoryOperationsContext } from '../../context/RepositoryOperationsContext';
import { ConfirmationScreen } from '../ConfirmationScreen';

interface ConfirmConvertRouteProps {
  screen: Extract<ScreenState, { type: 'confirm-convert' }>;
}

export function ConfirmConvertRoute({ screen }: ConfirmConvertRouteProps) {
  const { goBack } = useForestNavigation();
  const { convert, openLegacyWithoutConvert } = useRepositoryOperationsContext();

  return (
    <ConfirmationScreen
      title={`Convert ${screen.repositoryName}?`}
      message="Legacy layout detected. Convert to .bare + worktrees structure?"
      onConfirm={() => void convert(screen.repositoryName, screen.repositoryPath)}
      onDecline={() => void openLegacyWithoutConvert(screen.repositoryName, screen.repositoryPath)}
      onCancel={goBack}
    />
  );
}
