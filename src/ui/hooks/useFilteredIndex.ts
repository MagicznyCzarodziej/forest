import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { fuzzyFilter } from '../../domain/search/fuzzy-filter';

export type FilteredIndexFilter<T> = (
  items: T[],
  query: string,
  getLabel: (item: T) => string,
) => T[];

export function useFilteredIndex<T>(
  items: T[],
  query: string,
  getLabel: (item: T) => string,
  filterItems: FilteredIndexFilter<T> = fuzzyFilter,
): {
  filtered: T[];
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
} {
  const filtered = useMemo(
    () => filterItems(items, query, getLabel),
    [items, query, filterItems, getLabel],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resetKey = `${query}\0${items.length}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setSelectedIndex(0);
  }

  const effectiveIndex = filtered.length === 0 ? 0 : Math.min(selectedIndex, filtered.length - 1);
  if (effectiveIndex !== selectedIndex) {
    setSelectedIndex(effectiveIndex);
  }

  return { filtered, selectedIndex: effectiveIndex, setSelectedIndex };
}
