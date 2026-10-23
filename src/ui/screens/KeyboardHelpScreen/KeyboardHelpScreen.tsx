import { useInput } from 'ink';
import { Box, Text } from 'ink';
import { PickerBody } from '../../components/PickerBody/PickerBody';
import { padEnd, visibleWidth } from '../../text-width';
import { ui } from '../../theme/uiTokens';
import { keyboardShortcutLines } from './keyboardShortcutLines';

interface KeyboardHelpScreenProps {
  onDismiss: () => void;
}

const KEYS_DESCRIPTION_GAP = 2;

export function KeyboardHelpScreen({ onDismiss }: KeyboardHelpScreenProps) {
  const keysColumnWidth =
    Math.max(...keyboardShortcutLines.map((line) => visibleWidth(line.keys))) +
    KEYS_DESCRIPTION_GAP;

  useInput((_, key) => {
    if (key.return || key.escape || key.leftArrow) {
      onDismiss();
    }
  });

  return (
    <PickerBody>
      <Box flexDirection="column">
        {keyboardShortcutLines.map((line) => (
          <Text key={line.keys}>
            <Text color={ui.screenTitle}>{padEnd(line.keys, keysColumnWidth)}</Text>
            <Text color={ui.listName}>{line.description}</Text>
          </Text>
        ))}
      </Box>
    </PickerBody>
  );
}
