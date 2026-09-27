import { useMemo, useState } from "react";
import type { RepoCatalogEntry } from "../../domain/types.js";
import { SearchQuery } from "../components/SearchQuery.js";
import { SelectableList } from "../components/SelectableList.js";
import { useFilteredIndex } from "../hooks/useFilteredIndex.js";
import { filterRepoCatalogBySearch } from "../../repos/repo-catalog.js";
import { repoToListRow } from "../format/repo-rows.js";
import { usePickerKeyboard } from "../hooks/usePickerKeyboard.js";
import { PickerBody } from "./PickerBody.js";

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
  emptyMessage = "No matching repositories",
}: RepoPickerScreenProps) {
  const [query, setQuery] = useState("");
  const { filtered, selectedIndex, setSelectedIndex } = useFilteredIndex(
    repos,
    query,
    (r) => r.name,
    filterRepoCatalogBySearch,
  );

  const repoNames = useMemo(() => repos.map((r) => r.name), [repos]);
  const listRows = useMemo(() => filtered.map(repoToListRow), [filtered]);

  usePickerKeyboard({
    candidates: repoNames,
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
      <SearchQuery query={query} />
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
