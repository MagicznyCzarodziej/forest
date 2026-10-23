import { useInput } from 'ink';
import { Box, Text } from 'ink';
import { PickerBody } from '../../components/PickerBody/PickerBody';
import { ui } from '../../theme/uiTokens';

interface MessageScreenProps {
  body: string;
  onDismiss: () => void;
}

export function MessageScreen({ body, onDismiss }: MessageScreenProps) {
  useInput((_, key) => {
    if (key.return || key.escape || key.leftArrow) {
      onDismiss();
    }
  });

  return (
    <PickerBody>
      <Box flexDirection="column">
        <Text color={ui.listName}>{body}</Text>
      </Box>
    </PickerBody>
  );
}
