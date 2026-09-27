import { use } from 'react';
import { TerminalLayoutContext } from '../layout/terminal-layout-context';

export function useTerminalLayout() {
  return use(TerminalLayoutContext);
}
