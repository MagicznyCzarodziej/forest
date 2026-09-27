import { useMemo, useState } from 'react';
import { SearchQuery } from '../components/SearchQuery.js';
import { SelectableList } from '../components/SelectableList.js';
import { useFilteredIndex } from '../hooks/useFilteredIndex.js';
import { usePickerKeyboard } from '../hooks/usePickerKeyboard.js';
import { canConfirmBranchSelection } from '../../branches/branch-picker.js';
import { PickerBody } from './PickerBody.js';

export interface BranchPickerScreenProps {
  branches: string[];
  initialQuery: string;
  onSelectBranch: (branch: string) => void;
  onEscape: () => void;
  emptyMessage?: string;
}

export function BranchPickerScreen({
  branches,
  initialQuery,
  onSelectBranch,
  onEscape,
  emptyMessage = 'No matching branches',
}: BranchPickerScreenProps) {
  const [query, setQuery] = useState(initialQuery);
  const { filtered, selectedIndex, setSelectedIndex } = useFilteredIndex(branches, query, (b) => b);

  const canConfirm = canConfirmBranchSelection(branches, query, filtered);
  const listRows = useMemo(() => filtered.map((b) => ({ id: b, primary: b })), [filtered]);

  const tabHint = usePickerKeyboard({
    items: branches,
    getLabel: (b) => b,
    listLength: filtered.length,
    selectedIndex,
    setSelectedIndex,
    query,
    setQuery,
    onEscape,
    onEnter: () => {
      if (!canConfirm) {
        return;
      }
      const selected = filtered[selectedIndex];
      if (selected) {
        onSelectBranch(selected);
      }
    },
  });

  return (
    <PickerBody>
      <SearchQuery query={query} hint={tabHint} />
      <SelectableList
        rows={listRows}
        selectedIndex={selectedIndex}
        listActive
        emptyMessage={emptyMessage}
      />
    </PickerBody>
  );
}
