import { useEffect, useState } from 'react';
import { useStdout } from 'ink';

export interface TerminalDimensions {
  rows: number;
  columns: number;
}

export function useTerminalDimensions(): TerminalDimensions {
  const { stdout } = useStdout();
  const [size, setSize] = useState<TerminalDimensions>({
    rows: stdout.rows ?? 24,
    columns: stdout.columns ?? 80,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        rows: stdout.rows ?? 24,
        columns: stdout.columns ?? 80,
      });
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  return size;
}
