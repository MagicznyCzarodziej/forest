import { Box } from 'ink';
import type { ReactNode } from 'react';

interface PickerBodyProps {
  children: ReactNode;
}

export function PickerBody({ children }: PickerBodyProps) {
  return (
    <Box flexDirection="column" height="100%">
      {children}
    </Box>
  );
}
