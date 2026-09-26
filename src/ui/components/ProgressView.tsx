import { Box, Text } from "ink";
import { ui } from "../theme/ui-tokens.js";

interface ProgressViewProps {
  title: string;
  lines: string[];
}

const MAX_LINES = 12;

export function ProgressView({ title, lines }: ProgressViewProps) {
  const visible = lines.slice(-MAX_LINES);
  return (
    <Box flexDirection="column" height="100%" overflow="hidden">
      <Text bold color={ui.listName}>{title}</Text>
      <Box flexDirection="column" marginTop={1} flexGrow={1}>
        {visible.length === 0 ? (
          <Text color={ui.muted}>Working…</Text>
        ) : (
          visible.map((line, index) => (
            <Text
              key={`${index}-${line.slice(0, 24)}`}
              color={ui.progressLog}
              wrap="truncate"
            >
              {line}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}
