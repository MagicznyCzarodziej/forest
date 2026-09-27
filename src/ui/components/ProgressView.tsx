import { Box, Text } from 'ink';
import { useTerminalLayout } from '../hooks/useTerminalLayout';
import { ui } from '../theme/ui-tokens';
import { wrapLinesForViewport } from '../text-width';

interface ProgressViewProps {
  lines: string[];
}

const MAX_LOGICAL_LINES = 40;

export function ProgressView({ lines }: ProgressViewProps) {
  const { contentWidth, contentHeight } = useTerminalLayout();
  const maxDisplayLines = Math.max(1, contentHeight);
  const visible = lines.slice(-MAX_LOGICAL_LINES);
  const displayLines =
    visible.length === 0 ? [] : wrapLinesForViewport(visible, contentWidth, maxDisplayLines);

  return (
    <Box flexDirection="column" width={contentWidth} height="100%" overflow="hidden">
      <Box flexDirection="column" width={contentWidth} flexGrow={1} overflow="hidden">
        {displayLines.length === 0 ? (
          <Text color={ui.muted}>Working…</Text>
        ) : (
          displayLines.map((line) => (
            <Text key={`log:${line}`} color={ui.progressLog}>
              {line}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}
