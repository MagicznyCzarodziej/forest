import type { ScreenState } from '../../navigation/navigation';
import { useForestOperationsContext } from '../../context/ForestOperationsContext';
import { ProgressView } from '../../components/ProgressView';

interface ProgressRouteProps {
  screen: Extract<ScreenState, { type: 'progress' }>;
}

export function ProgressRoute({ screen }: ProgressRouteProps) {
  void screen;
  const { progressLines } = useForestOperationsContext();

  return <ProgressView lines={progressLines} />;
}
