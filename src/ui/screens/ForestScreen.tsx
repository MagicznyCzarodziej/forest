import { FullscreenShell } from '../layout/FullscreenShell';
import { useForestNavigation } from '../context/ForestNavigationContext';
import { useScreenSubtitle } from '../hooks/useScreenSubtitle';
import { ScreenRouter } from './ScreenRouter';
import { ScreenState } from '../navigation/navigation';

export function ForestScreen() {
  const { screen } = useForestNavigation();
  const subtitle = useScreenSubtitle();

  return (
    <FullscreenShell subtitle={subtitle} footer={screenFooter(screen)}>
      <ScreenRouter />
    </FullscreenShell>
  );
}

function screenFooter(screen: ScreenState): string | undefined {
  if (screen.type === 'confirm-clone' || screen.type === 'confirm-convert') {
    return '←→ choose · Y/N · Enter confirm · Esc cancel';
  }
  if (screen.type === 'progress') {
    return 'Working…';
  }
  return undefined;
}
