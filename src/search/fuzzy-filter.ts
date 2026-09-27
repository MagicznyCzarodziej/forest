import fuzzysort from 'fuzzysort';

/** `0` means no cap. fuzzysort otherwise returns only its first 10 hits. */
const SEARCH_OPTIONS = { limit: 0 } as const;

export function fuzzyFilter<T>(items: T[], query: string, getLabel: (item: T) => string): T[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [...items];
  }

  return fuzzysort
    .go(trimmed, items, { ...SEARCH_OPTIONS, key: getLabel })
    .map((result) => result.obj);
}
