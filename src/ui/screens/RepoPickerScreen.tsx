import { useMemo, useState } from 'react';
import type { RepoCatalogEntry } from '../../domain/types';
import { SearchQuery } from '../components/SearchQuery';
import { SelectableList } from '../components/SelectableList';
import { useFilteredIndex } from '../hooks/useFilteredIndex';
import { filterRepoCatalogBySearch } from '../../repos/repo-catalog';
import { repoToListRow } from '../format/repo-rows';
import { usePickerKeyboard } from '../hooks/usePickerKeyboard';
import { PickerBody } from './PickerBody';

export interface RepoPickerScreenProps {
  repos: RepoCatalogEntry[];
  onSelect: (repo: RepoCatalogEntry) => void;
  onEscape: () => void;
  emptyMessage?: string;
}

export function RepoPickerScreen({
  repos,
  onSelect,
  onEscape,
  emptyMessage = 'No matching repositories',
}: RepoPickerScreenProps) {
  const [query, setQuery] = useState('');
  const { filtered, selectedIndex, setSelectedIndex } = useFilteredIndex(
    repos,
    query,
    (r) => r.name,
    filterRepoCatalogBySearch,
  );

  const listRows = useMemo(() => filtered.map(repoToListRow), [filtered]);

  const tabHint = usePickerKeyboard({
    items: repos,
    getLabel: (r) => r.name,
    filterItems: filterRepoCatalogBySearch,
    listLength: filtered.length,
    selectedIndex,
    setSelectedIndex,
    query,
    setQuery,
    onEscape,
    onEnter: (_q, len, index) => {
      const selected = len > 0 ? filtered[index] : undefined;
      if (selected) {
        onSelect(selected);
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
        showSuffixColumn
        showHintColumn
        emptyMessage={emptyMessage}
      />
    </PickerBody>
  );
}
