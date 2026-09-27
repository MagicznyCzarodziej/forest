import type { ScreenState } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';
import { useForestOperationsContext } from '../../context/ForestOperationsContext';
import { ConfirmationScreen } from '../ConfirmationScreen';

interface ConfirmCloneRouteProps {
  screen: Extract<ScreenState, { type: 'confirm-clone' }>;
}

export function ConfirmCloneRoute({ screen }: ConfirmCloneRouteProps) {
  const { goBack } = useForestNavigation();
  const { clone } = useForestOperationsContext();

  return (
    <ConfirmationScreen
      title={`Clone ${screen.repositoryName}?`}
      message="This repository is not on disk yet."
      onConfirm={() => void clone(screen.repositoryName)}
      onDecline={goBack}
      onCancel={goBack}
    />
  );
}
