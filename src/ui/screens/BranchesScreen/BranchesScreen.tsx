import { useMemo, useState } from 'react';
import { SearchQuery } from '../../components/PickerBody/SearchQuery';
import { SelectableList } from '../../components/SelectableList/SelectableList';
import { useFilteredIndex } from '../../hooks/useFilteredIndex';
import { usePickerKeyboard } from '../../hooks/usePickerKeyboard/usePickerKeyboard';
import { PickerBody } from '../../components/PickerBody/PickerBody';

export interface BranchesScreenProps {
  branches: string[];
  onSelectBranch: (branch: string) => void;
  onEscape: () => void;
  emptyMessage?: string;
}

export function BranchesScreen({
  branches,
  onSelectBranch,
  onEscape,
  emptyMessage = 'No matching branches',
}: BranchesScreenProps) {
  const [query, setQuery] = useState('');

  const { filtered, selectedIndex, setSelectedIndex } = useFilteredIndex(
    branches,
    query,
    (branch) => branch,
  );

  const listRows = useMemo(
    () => filtered.map((branch) => ({ id: branch, primary: branch })),
    [filtered],
  );

  const tabHint = usePickerKeyboard({
    items: branches,
    getLabel: (b) => b,
    listLength: filtered.length,
    selectedIndex,
    setSelectedIndex,
    query,
    setQuery,
    onEscape,
    onEnter: (_, length, index) => {
      const selected = length > 0 ? filtered[index] : undefined;
      if (selected) {
        onSelectBranch(selected);
      }
    },
  });

  return (
    <PickerBody>
      <SearchQuery query={query} hint={tabHint} />
      <SelectableList rows={listRows} selectedIndex={selectedIndex} emptyMessage={emptyMessage} />
    </PickerBody>
  );
}
