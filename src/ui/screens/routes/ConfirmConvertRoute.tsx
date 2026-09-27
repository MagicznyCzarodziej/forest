import type { ScreenState } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';
import { useForestOperationsContext } from '../../context/ForestOperationsContext';
import { ConfirmationScreen } from '../ConfirmationScreen';

interface ConfirmConvertRouteProps {
  screen: Extract<ScreenState, { type: 'confirm-convert' }>;
}

export function ConfirmConvertRoute({ screen }: ConfirmConvertRouteProps) {
  const { goBack } = useForestNavigation();
  const { convert, openLegacyWithoutConvert } = useForestOperationsContext();

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
