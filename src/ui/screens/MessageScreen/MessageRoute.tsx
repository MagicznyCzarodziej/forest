import type { ScreenState } from '../../navigation/navigation';
import { popScreen } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';
import { MessageScreen } from './MessageScreen';

interface MessageRouteProps {
  screen: Extract<ScreenState, { type: 'message' }>;
}

export function MessageRoute({ screen }: MessageRouteProps) {
  const { setStack } = useForestNavigation();

  return (
    <MessageScreen
      body={screen.body}
      onDismiss={() => setStack((stack) => popScreen(stack))}
    />
  );
}
