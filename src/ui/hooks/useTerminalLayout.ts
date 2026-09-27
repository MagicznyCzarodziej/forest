import { use } from 'react';
import { TerminalLayoutContext } from '../layout/TerminalLayoutContext';

export function useTerminalLayout() {
  return use(TerminalLayoutContext);
}
