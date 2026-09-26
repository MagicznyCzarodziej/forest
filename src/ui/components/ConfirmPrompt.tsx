import { Box, Text } from "ink";
import { ui } from "../theme/ui-tokens.js";

interface ConfirmPromptProps {
  title: string;
  message: string;
  selected: "yes" | "no";
}

export function ConfirmPrompt({ title, message, selected }: ConfirmPromptProps) {
  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="center">
      <Text bold color={ui.listName}>{title}</Text>
      <Text color={ui.muted}>{message}</Text>
      <Box marginTop={1} gap={2}>
        <Text
          backgroundColor={selected === "yes" ? ui.selectionBg : undefined}
          color={ui.listName}
          bold={selected === "yes"}
        >
          [Y] Yes
        </Text>
        <Text
          backgroundColor={selected === "no" ? ui.selectionBg : undefined}
          color={ui.listName}
          bold={selected === "no"}
        >
          [N] No
        </Text>
      </Box>
    </Box>
  );
}
