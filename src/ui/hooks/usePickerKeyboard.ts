import { useRef, type Dispatch, type SetStateAction } from "react";
import { useInput } from "ink";
import { tabCompleteAdvance, type TabCycleState } from "../../search/tab-complete.js";
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

export function usePickerKeyboard(options: UsePickerKeyboardOptions): void {
  const tabCycleRef = useRef<TabCycleState | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const resetTabCycle = () => {
    tabCycleRef.current = null;
  };

  useInput((input, key) => {
    const opts = optionsRef.current;

    // Confirm prompts own Left/Right for choosing Yes/No; pickers use Left as back.
    if (key.escape || key.leftArrow) {
      resetTabCycle();
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
    if (key.backspace || key.delete) {
      resetTabCycle();
      opts.setQuery((q) => q.slice(0, -1));
      return;
    }
    if (!key.ctrl && !key.meta && input) {
      resetTabCycle();
      opts.setQuery((q) => q + input);
    }
  });
}
