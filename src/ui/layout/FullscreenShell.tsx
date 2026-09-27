import { Box, Text } from 'ink';
import { type ReactNode, useMemo } from 'react';
import { useAlternateScrollMode } from '../hooks/useAlternateScrollMode.js';
import { useTerminalDimensions } from '../hooks/useTerminalDimensions.js';
import { TerminalLayoutContext } from './terminal-layout-context.js';
import {
  listDataRowSlots,
  panelRenderHeight,
  shellBodyHeight,
  SUBTITLE_LINES,
} from './terminal-chrome.js';
import {
  horizontalPadding,
  INNER_PADDING_X,
  resolveInnerContentWidth,
  resolvePanelWidth,
} from './content-width.js';
import { ui } from '../theme/ui-tokens.js';

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
  const { rows, columns } = useTerminalDimensions();
  const panelWidth = resolvePanelWidth(columns);
  const contentWidth = resolveInnerContentWidth(panelWidth);
  const paddingX = horizontalPadding(columns, panelWidth);
  const withSubtitle = Boolean(subtitle);
  const panelHeight = panelRenderHeight(rows);
  const bodyHeight = shellBodyHeight(rows, withSubtitle);
  const listViewportRows = listDataRowSlots(rows, withSubtitle);

  const layoutValue = useMemo(
    () => ({
      terminalColumns: columns,
      panelWidth,
      contentWidth,
      paddingX,
      bodyHeight,
      listViewportRows,
      terminalRows: rows,
    }),
    [columns, rows, panelWidth, contentWidth, paddingX, bodyHeight, listViewportRows],
  );

  return (
    <TerminalLayoutContext value={layoutValue}>
      <Box width={columns} height={panelHeight} flexDirection="column" overflow="hidden">
        <Box marginLeft={paddingX} flexDirection="column" width={panelWidth} height={panelHeight}>
          <Box
            flexDirection="column"
            width={panelWidth}
            height={panelHeight}
            borderStyle="single"
            borderColor={ui.border}
            borderTop={false}
            borderBottom={false}
            overflow="hidden"
          >
            {withSubtitle ? (
              <Box height={SUBTITLE_LINES} paddingX={INNER_PADDING_X}>
                <Text color={ui.screenTitle}>{subtitle}</Text>
              </Box>
            ) : null}

            <Box
              flexDirection="column"
              height={bodyHeight}
              paddingX={INNER_PADDING_X}
              overflow="hidden"
            >
              {children}
            </Box>

            <Box height={1} paddingX={INNER_PADDING_X}>
              <Text color={ui.footer} wrap="truncate">
                {footer}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </TerminalLayoutContext>
  );
}
