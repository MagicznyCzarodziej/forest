import { useMemo, useState } from 'react';
import type { WorktreeEntry } from '../../../domain/types';
import { SearchQuery } from '../../components/PickerBody/SearchQuery';
import { SelectableList } from '../../components/SelectableList/SelectableList';
import { useFilteredIndex } from '../../hooks/useFilteredIndex';
import { usePickerKeyboard } from '../../hooks/usePickerKeyboard/usePickerKeyboard';
import { PickerBody } from '../../components/PickerBody/PickerBody';

export interface WorktreesScreenProps {
  worktrees: WorktreeEntry[];
  openingWorktreePath?: string | null;
  onOpenWorktree: (worktree: WorktreeEntry) => void;
  onCreateFromQuery: (query: string) => void;
  onEscape: () => void;
  emptyMessage?: string;
}

export function WorktreesScreen({
  worktrees,
  openingWorktreePath = null,
  onOpenWorktree,
  onCreateFromQuery,
  onEscape,
  emptyMessage = 'No matching worktrees — Enter to create one',
}: WorktreesScreenProps) {
  const [query, setQuery] = useState('');
  const { filtered, selectedIndex, setSelectedIndex } = useFilteredIndex(
    worktrees,
    query,
    (worktree) => worktree.branch,
  );

  const listRows = useMemo(
    () =>
      filtered.map((worktree) => {
        const opening = worktree.path === openingWorktreePath;
        return {
          id: worktree.path,
          primary: worktree.branch,
          statusText: opening ? 'Opening...' : undefined,
          suffixRole: worktree.isDefaultBranch ? ('default' as const) : undefined,
        };
      }),
    [filtered, openingWorktreePath],
  );

  const tabHint = usePickerKeyboard({
    items: worktrees,
    getLabel: (worktree) => worktree.branch,
    listLength: filtered.length,
    selectedIndex,
    setSelectedIndex,
    query,
    setQuery,
    onEscape,
    onEnter: (q, length, index) => {
      if (length > 0) {
        const selected = filtered[index];
        if (selected) {
          onOpenWorktree(selected);
        }
        return;
      }
      if (q.trim()) {
        onCreateFromQuery(q.trim());
      }
    },
  });

  return (
    <PickerBody>
      <SearchQuery query={query} hint={tabHint} />
      <SelectableList
        rows={listRows}
        selectedIndex={selectedIndex}
        showSuffixColumn
        emptyMessage={emptyMessage}
      />
    </PickerBody>
  );
}
