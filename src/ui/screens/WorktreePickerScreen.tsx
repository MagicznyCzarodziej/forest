import { useMemo, useState } from "react";
import type { WorktreeEntry } from "../../domain/types.js";
import { SearchQuery } from "../components/SearchQuery.js";
import { SelectableList } from "../components/SelectableList.js";
import { useFilteredIndex } from "../hooks/useFilteredIndex.js";
import { usePickerKeyboard } from "../hooks/usePickerKeyboard.js";
import { PickerBody } from "./PickerBody.js";

export interface WorktreePickerScreenProps {
  worktrees: WorktreeEntry[];
  openingWorktreePath?: string | null;
  onOpenWorktree: (worktree: WorktreeEntry) => void;
  onCreateFromQuery: (query: string) => void;
  onEscape: () => void;
  emptyMessage?: string;
}

export function WorktreePickerScreen({
  worktrees,
  openingWorktreePath = null,
  onOpenWorktree,
  onCreateFromQuery,
  onEscape,
  emptyMessage = "No matching worktrees — Enter to create one",
}: WorktreePickerScreenProps) {
  const [query, setQuery] = useState("");
  const { filtered, selectedIndex, setSelectedIndex } = useFilteredIndex(
    worktrees,
    query,
    (w) => w.branch,
  );

  const listRows = useMemo(
    () =>
      filtered.map((w) => {
        const opening = w.path === openingWorktreePath;
        return {
          id: w.path,
          primary: w.branch,
          statusText: opening ? "Opening..." : undefined,
          suffixRole: w.isDefaultBranch ? ("default" as const) : undefined,
        };
      }),
    [filtered, openingWorktreePath],
  );

  const tabHint = usePickerKeyboard({
    items: worktrees,
    getLabel: (w) => w.branch,
    listLength: filtered.length,
    selectedIndex,
    setSelectedIndex,
    query,
    setQuery,
    onEscape,
    onEnter: (q, len, index) => {
      if (len > 0) {
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
        listActive
        showSuffixColumn
        emptyMessage={emptyMessage}
      />
    </PickerBody>
  );
}
