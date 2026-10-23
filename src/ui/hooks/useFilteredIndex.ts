import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { fuzzyFilter } from '../../domain/search/fuzzy-filter';

export type FilteredIndexFilter<T> = (
  items: T[],
  query: string,
  getLabel: (item: T) => string,
) => T[];

export interface UseFilteredIndexOptions {
  /** Keeps the same item selected when `items` changes (e.g. background list refresh). */
  preserveItemOnListChange?: boolean;
}

export function resolveStableSelectionIndex<T>(
  filtered: T[],
  previousIndex: number,
  selectedLabel: string | null,
  getLabel: (item: T) => string,
): { index: number; label: string | null } {
  if (filtered.length === 0) {
    return { index: 0, label: null };
  }
  if (selectedLabel !== null) {
    const matchIndex = filtered.findIndex((item) => getLabel(item) === selectedLabel);
    if (matchIndex >= 0) {
      return { index: matchIndex, label: selectedLabel };
    }
  }
  const index = Math.min(previousIndex, filtered.length - 1);
  return { index, label: getLabel(filtered[index]) };
}

export function useFilteredIndex<T>(
  items: T[],
  query: string,
  getLabel: (item: T) => string,
  filterItems: FilteredIndexFilter<T> = fuzzyFilter,
  options: UseFilteredIndexOptions = {},
): {
  filtered: T[];
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
} {
  const preserveItemOnListChange = options.preserveItemOnListChange ?? false;
  const filtered = useMemo(
    () => filterItems(items, query, getLabel),
    [items, query, filterItems, getLabel],
  );
  const [selectedIndex, setSelectedIndexState] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const resetKey = preserveItemOnListChange ? query : `${query}\0${items.length}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setSelectedIndexState(0);
    setSelectedLabel(null);
  }

  const effectiveIndex =
    filtered.length === 0
      ? 0
      : preserveItemOnListChange
        ? resolveStableSelectionIndex(filtered, selectedIndex, selectedLabel, getLabel).index
        : Math.min(selectedIndex, filtered.length - 1);

  if (effectiveIndex !== selectedIndex) {
    setSelectedIndexState(effectiveIndex);
  }

  if (preserveItemOnListChange && filtered.length > 0) {
    const nextLabel = getLabel(filtered[effectiveIndex]);
    if (nextLabel !== selectedLabel) {
      setSelectedLabel(nextLabel);
    }
  }

  const setSelectedIndex: Dispatch<SetStateAction<number>> = (action) => {
    setSelectedIndexState((previousIndex) => {
      const nextIndex = typeof action === 'function' ? action(previousIndex) : action;
      if (filtered.length === 0) {
        setSelectedLabel(null);
        return 0;
      }
      const clamped = Math.min(Math.max(0, nextIndex), filtered.length - 1);
      setSelectedLabel(getLabel(filtered[clamped]));
      return clamped;
    });
  };

  return { filtered, selectedIndex: effectiveIndex, setSelectedIndex };
}
