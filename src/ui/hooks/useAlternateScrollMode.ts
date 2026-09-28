import { useStdout } from 'ink';
import { useLayoutEffect } from 'react';
import {
  disableAlternateScrollMode,
  enableAlternateScrollMode,
} from '../../infrastructure/terminal/alternateScrollMode';

/**
 * Map mouse wheel to ↑/↓ keys in the alternate screen so the terminal viewport
 * does not scroll (xterm DEC mode 1007).
 */
export function useAlternateScrollMode(): void {
  const { stdout } = useStdout();

  useLayoutEffect(() => {
    enableAlternateScrollMode(stdout);
    return () => {
      disableAlternateScrollMode(stdout);
    };
  }, [stdout]);
}
