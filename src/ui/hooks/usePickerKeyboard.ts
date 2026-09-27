import { useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import { useInput } from "ink";
import { queryEditAction, applyQueryEdit } from "../../search/query-editing.js";
import { fuzzyFilter } from "../../search/fuzzy-filter.js";
import {
  tabCompleteAdvance,
  tabCompleteHint,
  type TabCycleState,
} from "../../search/tab-complete.js";
import { jumpListIndex, moveListIndex } from "../list-navigation.js";
import type { FilteredIndexFilter } from "./useFilteredIndex.js";

interface UsePickerKeyboardOptions<T> {
  items: T[];
  getLabel: (item: T) => string;
  filterItems?: FilteredIndexFilter<T>;
  listLength: number;
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  query: string;
  setQuery: (value: string | ((q: string) => string)) => void;
  onEscape: () => void;
  onEnter: (query: string, filteredLength: number, selectedIndex: number) => void;
}

export function usePickerKeyboard<T>(options: UsePickerKeyboardOptions<T>): string {
  const tabCycleRef = useRef<TabCycleState | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const getLabelRef = useRef(options.getLabel);
  getLabelRef.current = options.getLabel;
  const filterItems = options.filterItems ?? fuzzyFilter;

  const tabOrderQuery = tabCycleRef.current?.baseQuery ?? options.query;
  const tabCandidates = useMemo(() => {
    const filtered = filterItems(options.items, tabOrderQuery, (item) =>
      getLabelRef.current(item),
    );
    return filtered.map((item) => getLabelRef.current(item));
  }, [filterItems, options.items, tabOrderQuery]);

  const resetTabCycle = () => {
    tabCycleRef.current = null;
  };

  useInput((input, key) => {
    const opts = optionsRef.current;

    // Confirm prompts own Left/Right for choosing Yes/No; pickers use Left as back.
    if (key.leftArrow) {
      resetTabCycle();
      opts.onEscape();
      return;
    }
    if (key.escape) {
      resetTabCycle();
      if (opts.query.length > 0) {
        opts.setQuery("");
        return;
      }
      opts.onEscape();
      return;
    }
    if (key.tab) {
      const filter = opts.filterItems ?? fuzzyFilter;
      const orderQuery = tabCycleRef.current?.baseQuery ?? opts.query;
      const candidates = filter(opts.items, orderQuery, (item) =>
        getLabelRef.current(item),
      ).map((item) => getLabelRef.current(item));
      const { query, state } = tabCompleteAdvance(
        opts.query,
        candidates,
        tabCycleRef.current,
      );
      tabCycleRef.current = state;
      opts.setQuery(query);
      return;
    }
    if (key.return) {
      resetTabCycle();
      opts.onEnter(opts.query, opts.listLength, opts.selectedIndex);
      return;
    }
    if ((key.home || key.end) && opts.listLength > 0) {
      resetTabCycle();
      const edge = key.home ? "home" : "end";
      opts.setSelectedIndex(jumpListIndex(edge, opts.listLength));
      return;
    }
    if (key.upArrow && opts.listLength > 0) {
      resetTabCycle();
      opts.setSelectedIndex((i) => moveListIndex(i, "up", opts.listLength));
      return;
    }
    if (key.downArrow && opts.listLength > 0) {
      resetTabCycle();
      opts.setSelectedIndex((i) => moveListIndex(i, "down", opts.listLength));
      return;
    }
    const editAction = queryEditAction(input, {
      ctrl: key.ctrl,
      meta: key.meta,
      super: key.super,
      backspace: key.backspace,
      delete: key.delete,
    });
    if (editAction) {
      resetTabCycle();
      opts.setQuery((q) => applyQueryEdit(q, editAction));
      return;
    }
    if (!key.ctrl && !key.meta && !key.super && input && input.charCodeAt(0) >= 32) {
      resetTabCycle();
      opts.setQuery((q) => q + input);
    }
  });

  return tabCompleteHint(options.query, tabCandidates, tabCycleRef.current);
}
