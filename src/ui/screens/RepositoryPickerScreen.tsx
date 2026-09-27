import { useMemo, useState } from 'react';
import type { RepositoryCatalogEntry } from '../../domain/types';
import { SearchQuery } from '../components/SearchQuery';
import { SelectableList } from '../components/SelectableList/SelectableList';
import { useFilteredIndex } from '../hooks/useFilteredIndex';
import { filterRepositoryCatalogBySearch } from '../../domain/repositories/repository-catalog';
import { repositoryToListRow } from '../format/repository-rows';
import { usePickerKeyboard } from '../hooks/usePickerKeyboard/usePickerKeyboard';
import { PickerBody } from './PickerBody';

export interface RepositoryPickerScreenProps {
  repositories: RepositoryCatalogEntry[];
  onSelect: (repository: RepositoryCatalogEntry) => void;
  onEscape: () => void;
  emptyMessage?: string;
}

export function RepositoryPickerScreen({
  repositories,
  onSelect,
  onEscape,
  emptyMessage = 'No matching repositories',
}: RepositoryPickerScreenProps) {
  const [query, setQuery] = useState('');
  const { filtered, selectedIndex, setSelectedIndex } = useFilteredIndex(
    repositories,
    query,
    (repository) => repository.name,
    filterRepositoryCatalogBySearch,
  );

  const listRows = useMemo(() => filtered.map(repositoryToListRow), [filtered]);

  const tabHint = usePickerKeyboard({
    items: repositories,
    getLabel: (repository) => repository.name,
    filterItems: filterRepositoryCatalogBySearch,
    listLength: filtered.length,
    selectedIndex,
    setSelectedIndex,
    query,
    setQuery,
    onEscape,
    onEnter: (_, length, index) => {
      const selectedRepository = length > 0 ? filtered[index] : undefined;
      if (selectedRepository) {
        onSelect(selectedRepository);
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
        showHintColumn
        emptyMessage={emptyMessage}
      />
    </PickerBody>
  );
}
