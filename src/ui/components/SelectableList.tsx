import { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { computeListViewport } from '../list-viewport.js';
import { useTerminalLayout } from '../hooks/useTerminalLayout.js';
import { ListRowBar, type ListRowData } from './ListRowBar.js';
import { ui } from '../theme/ui-tokens.js';

export type ListRow = ListRowData;

interface SelectableListProps {
  rows: ListRow[];
  selectedIndex: number;
  listActive: boolean;
  emptyMessage?: string;
  showSuffixColumn?: boolean;
  showHintColumn?: boolean;
}

export const SelectableList = memo(function SelectableList({
  rows,
  selectedIndex,
  listActive,
  emptyMessage = 'No matches',
  showSuffixColumn = false,
  showHintColumn = false,
}: SelectableListProps) {
  const { contentWidth, listViewportRows } = useTerminalLayout();
  const rowSlots = listViewportRows;

  const { offset, visibleCount } = useMemo(
    () => computeListViewport(selectedIndex, rows.length, rowSlots),
    [selectedIndex, rows.length, rowSlots],
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
      <Box flexDirection="column" height={rowSlots} width={contentWidth}>
        {visibleRows.map((row, index) => {
          const absoluteIndex = offset + index;
          return (
            <ListRowBar
              key={row.id}
              row={row}
              selected={absoluteIndex === selectedIndex}
              active={listActive}
              contentWidth={contentWidth}
              showSuffixColumn={showSuffixColumn}
              showHintColumn={showHintColumn}
            />
          );
        })}
      </Box>
    </Box>
  );
});
