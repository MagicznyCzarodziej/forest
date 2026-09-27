import { Box, Text } from 'ink';
import { type ReactNode, useMemo } from 'react';
import { useAlternateScrollMode } from '../hooks/useAlternateScrollMode';
import { useTerminalDimensions } from '../hooks/useTerminalDimensions';
import { TerminalLayoutContext } from './TerminalLayoutContext';
import {
  listDataRowSlots,
  resolveAppHeight,
  resolveContentHeight,
  SUBTITLE_LINES,
} from './terminalChrome';
import {
  APP_HORIZONTAL_PADDING_WIDTH,
  horizontalPadding,
  resolveAppWidth,
  resolveContentWidth,
} from './contentWidth';
import { ui } from '../theme/ui-tokens';

const DEFAULT_FOOTER =
  '↑↓ Home End list · type to filter · Tab complete · Enter · Esc back · Ctrl+C quit';

interface FullscreenShellProps {
  subtitle?: string;
  footer?: string;
  children: ReactNode;
}

export function FullscreenShell({
  subtitle,
  footer = DEFAULT_FOOTER,
  children,
}: FullscreenShellProps) {
  useAlternateScrollMode();

  const { rows: terminalRows, columns: terminalColumns } = useTerminalDimensions();

  const appWidth = resolveAppWidth(terminalColumns);
  const appHeight = resolveAppHeight(terminalRows);

  const hasSubtitle = !!subtitle;
  const contentWidth = resolveContentWidth(appWidth);
  const contentHeight = resolveContentHeight(terminalRows, hasSubtitle);

  const paddingX = horizontalPadding(terminalColumns, appWidth);
  const listViewportRows = listDataRowSlots(terminalRows, hasSubtitle);

  const layoutContextValue = useMemo(
    () => ({
      terminalColumns,
      appWidth,
      contentWidth,
      paddingX,
      contentHeight,
      listViewportRows,
      terminalRows,
    }),
    [
      terminalColumns,
      terminalRows,
      appWidth,
      contentWidth,
      paddingX,
      contentHeight,
      listViewportRows,
    ],
  );

  return (
    <TerminalLayoutContext value={layoutContextValue}>
      <Box width={terminalColumns} height={appHeight} flexDirection="column" overflow="hidden">
        <Box
          width={appWidth}
          height={appHeight}
          marginLeft={paddingX}
          flexDirection="column"
          borderStyle="single"
          borderColor={ui.border}
          borderTop={false}
          borderBottom={false}
          overflow="hidden"
        >
          {hasSubtitle ? (
            <Box height={SUBTITLE_LINES} paddingX={APP_HORIZONTAL_PADDING_WIDTH}>
              <Text color={ui.screenTitle}>{subtitle}</Text>
            </Box>
          ) : null}

          <Box
            flexDirection="column"
            height={contentHeight}
            paddingX={APP_HORIZONTAL_PADDING_WIDTH}
            overflow="hidden"
          >
            {children}
          </Box>

          <Box height={1} paddingX={APP_HORIZONTAL_PADDING_WIDTH}>
            <Text color={ui.footer} wrap="truncate">
              {footer}
            </Text>
          </Box>
        </Box>
      </Box>
    </TerminalLayoutContext>
  );
}
