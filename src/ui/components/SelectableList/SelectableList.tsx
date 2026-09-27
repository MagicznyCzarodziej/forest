import { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { computeListViewport } from './listViewport';
import { useTerminalLayout } from '../../hooks/useTerminalLayout';
import { ListRowBar, type ListRowData } from '../ListRowBar/ListRowBar';
import { ui } from '../../theme/uiTokens';

export type ListRow = ListRowData;

interface SelectableListProps {
  rows: ListRow[];
  selectedIndex: number;
  emptyMessage?: string;
  showSuffixColumn?: boolean;
  showHintColumn?: boolean;
}

export const SelectableList = memo(function SelectableList({
  rows,
  selectedIndex,
  emptyMessage = 'No matches',
  showSuffixColumn = false,
  showHintColumn = false,
}: SelectableListProps) {
  const { contentWidth, listViewportRows } = useTerminalLayout();

  const { offset, visibleCount } = useMemo(
    () => computeListViewport(selectedIndex, rows.length, listViewportRows),
    [selectedIndex, rows.length, listViewportRows],
  );

  const visibleRows = useMemo(
    () => rows.slice(offset, offset + visibleCount),
    [rows, offset, visibleCount],
  );

  if (rows.length === 0) {
    return (
      <Box width={contentWidth}>
        <Text color={ui.muted}>{emptyMessage}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} width={contentWidth}>
      {visibleRows.map((row, index) => {
        const absoluteIndex = offset + index;
        return (
          <ListRowBar
            key={row.id}
            row={row}
            isSelected={absoluteIndex === selectedIndex}
            contentWidth={contentWidth}
            showSuffixColumn={showSuffixColumn}
            showHintColumn={showHintColumn}
          />
        );
      })}
    </Box>
  );
});
