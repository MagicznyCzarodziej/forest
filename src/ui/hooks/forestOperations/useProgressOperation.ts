import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { pushScreen, type ScreenState } from '../../navigation/navigation';
import { normalizeTerminalLine } from '../../text-width';

interface UseProgressOperationOptions {
  setStack: Dispatch<SetStateAction<ScreenState[]>>;
}

export function useProgressOperation({ setStack }: UseProgressOperationOptions) {
  const [progressLines, setProgressLines] = useState<string[]>([]);

  const appendProgress = useCallback((line: string) => {
    const normalized = normalizeTerminalLine(line);
    if (normalized.trim().length === 0) {
      return;
    }
    setProgressLines((lines) => [...lines.slice(-200), normalized]);
  }, []);

  const runProgress = useCallback(
    async (title: string, action: () => Promise<void>) => {
      setProgressLines([]);
      setStack((stack) => pushScreen(stack, { type: 'progress', title, message: '' }));
      try {
        await action();
      } catch (error) {
        appendProgress(error instanceof Error ? error.message : 'Operation failed');
      }
    },
    [appendProgress, setStack],
  );

  return { progressLines, runProgress, appendProgress };
}
