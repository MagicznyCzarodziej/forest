import { Box, Text } from 'ink';
import { useTerminalLayout } from '../hooks/useTerminalLayout';
import { ui } from '../theme/uiTokens';

interface ConfirmPromptProps {
  title: string;
  message: string;
  selected: 'yes' | 'no';
}

export function ConfirmPrompt({ title, message, selected }: ConfirmPromptProps) {
  const { contentWidth } = useTerminalLayout();

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="center" width={contentWidth}>
      <Text bold color={ui.listName} wrap="wrap">
        {title}
      </Text>
      <Text color={ui.muted} wrap="wrap">
        {message}
      </Text>
      <Box marginTop={1} gap={2}>
        <Text
          backgroundColor={selected === 'yes' ? ui.selectionBg : undefined}
          color={ui.listName}
          bold={selected === 'yes'}
        >
          [Y] Yes
        </Text>
        <Text
          backgroundColor={selected === 'no' ? ui.selectionBg : undefined}
          color={ui.listName}
          bold={selected === 'no'}
        >
          [N] No
        </Text>
      </Box>
    </Box>
  );
}
