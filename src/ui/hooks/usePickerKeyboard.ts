import { useRef, type Dispatch, type SetStateAction } from "react";
import { useInput } from "ink";
import { queryEditAction, applyQueryEdit } from "../../search/query-editing.js";
import {
  tabCompleteAdvance,
  tabCompleteHint,
  type TabCycleState,
} from "../../search/tab-complete.js";
import { jumpListIndex, moveListIndex } from "../list-navigation.js";

interface UsePickerKeyboardOptions {
  candidates: string[];
  listLength: number;
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  query: string;
  setQuery: (value: string | ((q: string) => string)) => void;
  onEscape: () => void;
  onEnter: (query: string, filteredLength: number, selectedIndex: number) => void;
}

export function usePickerKeyboard(options: UsePickerKeyboardOptions): string {
  const tabCycleRef = useRef<TabCycleState | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

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
      const { query, state } = tabCompleteAdvance(
        opts.query,
        opts.candidates,
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

  return tabCompleteHint(options.query, options.candidates, tabCycleRef.current);
}
