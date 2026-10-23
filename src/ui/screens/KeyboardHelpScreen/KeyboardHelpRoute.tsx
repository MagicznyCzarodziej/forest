import { popScreen } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';
import { KeyboardHelpScreen } from './KeyboardHelpScreen';

export function KeyboardHelpRoute() {
  const { setStack } = useForestNavigation();

  return <KeyboardHelpScreen onDismiss={() => setStack((stack) => popScreen(stack))} />;
}
