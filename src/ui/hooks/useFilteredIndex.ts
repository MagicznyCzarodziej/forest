import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { fuzzyFilter } from "../../search/fuzzy-filter.js";

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
  const getLabelRef = useRef(getLabel);
  getLabelRef.current = getLabel;

  const filtered = useMemo(
    () => filterItems(items, query, (item) => getLabelRef.current(item)),
    [items, query, filterItems],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, items.length]);

  useEffect(() => {
    setSelectedIndex((current) => {
      if (filtered.length === 0) {
        return 0;
      }
      if (current >= filtered.length) {
        return filtered.length - 1;
      }
      return current;
    });
  }, [filtered.length]);

  return { filtered, selectedIndex, setSelectedIndex };
}
