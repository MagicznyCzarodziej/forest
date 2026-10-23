import { useMemo, useState } from 'react';
import { filterRepositoryCatalogBySearch } from '../../../domain/repositories/repository-catalog';
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
import { pushScreen } from '../../navigation/navigation';
import { useForestNavigation } from '../../context/ForestNavigationContext';

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
  const { setStack } = useForestNavigation();
  const [query, setQuery] = useState('');
  const [strictNameMatch, setStrictNameMatch] = useState(false);

  const listFilter = strictNameMatch
    ? filterRepositoryPickerEntries
    : filterRepositoryCatalogBySearch;

  const {
    filtered: pickerEntries,
    selectedIndex,
    setSelectedIndex,
  } = useFilteredIndex(repositories, query, (repository) => repository.name, listFilter);

  const cloneByNameCandidate = useMemo(
    () => (strictNameMatch ? remoteCloneByNameCandidate(repositories, query) : undefined),
    [repositories, query, strictNameMatch],
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

  usePickerKeyboard({
    items: repositories,
    getLabel: (repository) => repository.name,
    filterItems: listFilter,
    listLength: pickerEntries.length,
    selectedIndex,
    setSelectedIndex,
    query,
    setQuery,
    onEscape,
    onToggleStrictMatch: () => {
      setStrictNameMatch((enabled) => !enabled);
      setSelectedIndex(0);
    },
    onOpenKeyboardHelp: () => setStack((stack) => pushScreen(stack, { type: 'keyboard-help' })),
    onEnter: (_, length, index) => {
      const selectedRepository = length > 0 ? pickerEntries[index] : undefined;
      if (selectedRepository) {
        onSelect(selectedRepository);
      }
    },
  });

  return (
    <PickerBody>
      <SearchQuery query={query} rightHint={strictNameMatch ? 'strict' : ''} />
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
