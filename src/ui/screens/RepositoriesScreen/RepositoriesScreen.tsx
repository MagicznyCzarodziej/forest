import { useMemo, useState } from 'react';
import type { RepositoryCatalogEntry } from '../../../domain/types';
import { SearchQuery } from '../../components/PickerBody/SearchQuery';
import { SelectableList } from '../../components/SelectableList/SelectableList';
import { useFilteredIndex } from '../../hooks/useFilteredIndex';
import {
  filterRepositoryPickerEntries,
  remoteCloneByNameCandidate,
} from '../../../domain/repositories/repository-catalog';
import { repositoryToListRow } from './repositoryToListRow';
import { usePickerKeyboard } from '../../hooks/usePickerKeyboard/usePickerKeyboard';
import { PickerBody } from '../../components/PickerBody/PickerBody';

export interface RepositoriesScreenProps {
  repositories: RepositoryCatalogEntry[];
  onSelect: (repository: RepositoryCatalogEntry) => void;
  onEscape: () => void;
  emptyMessage?: string;
}

export function RepositoriesScreen({
  repositories,
  onSelect,
  onEscape,
  emptyMessage = 'No matching repositories',
}: RepositoriesScreenProps) {
  const [query, setQuery] = useState('');
  const {
    filtered: pickerEntries,
    selectedIndex,
    setSelectedIndex,
  } = useFilteredIndex(
    repositories,
    query,
    (repository) => repository.name,
    filterRepositoryPickerEntries,
  );

  const cloneByNameCandidate = useMemo(
    () => remoteCloneByNameCandidate(repositories, query),
    [repositories, query],
  );

  const listRows = useMemo(
    () =>
      pickerEntries.map((repository, index) =>
        cloneByNameCandidate && index === 0 && repository.name === cloneByNameCandidate.name
          ? {
              id: `clone:${repository.name}`,
              primary: repository.name,
              statusText: 'Clone from GitHub',
              suffixRole: 'not-cloned' as const,
            }
          : repositoryToListRow(repository),
      ),
    [cloneByNameCandidate, pickerEntries],
  );

  const tabHint = usePickerKeyboard({
    items: repositories,
    getLabel: (repository) => repository.name,
    filterItems: filterRepositoryPickerEntries,
    listLength: pickerEntries.length,
    selectedIndex,
    setSelectedIndex,
    query,
    setQuery,
    onEscape,
    onEnter: (_, length, index) => {
      const selectedRepository = length > 0 ? pickerEntries[index] : undefined;
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
