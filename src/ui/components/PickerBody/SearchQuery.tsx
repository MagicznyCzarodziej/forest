import { Box, Text } from 'ink';
import { ui } from '../../theme/uiTokens';
import { useTerminalLayout } from '../../hooks/useTerminalLayout';
import { visibleWidth } from '../../text-width';

interface SearchQueryProps {
  query: string;
  hint?: string;
  rightHint?: string;
}

export function SearchQuery({ query, hint = '', rightHint = '' }: SearchQueryProps) {
  const { contentWidth } = useTerminalLayout();
  // Keep empty line rendered if empty query
  const display = query.length > 0 ? query : ' ';
  const right = rightHint.length > 0 ? rightHint : '';
  const rightWidth = right.length > 0 ? visibleWidth(right) : 0;
  const leftWidth = right.length > 0 ? Math.max(1, contentWidth - rightWidth) : contentWidth;

  return (
    <Box width={contentWidth} flexDirection="row">
      <Box width={leftWidth}>
        <Text bold wrap="truncate-end">
          <Text color={ui.filter}>{display}</Text>
          {hint.length > 0 ? <Text color={ui.muted}>{hint}</Text> : null}
        </Text>
      </Box>
      {right.length > 0 ? (
        <Text color={ui.muted} wrap="truncate-end">
          {right}
        </Text>
      ) : null}
    </Box>
  );
}
