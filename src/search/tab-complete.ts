function compareNames(a: string, b: string): number {
  return a.toLowerCase().localeCompare(b.toLowerCase());
}

function namesStartingWith(query: string, candidates: string[]): string[] {
  const needle = query.trim().toLowerCase();
  return [...new Set(candidates)]
    .filter((name) => name.toLowerCase().startsWith(needle))
    .sort(compareNames);
}

function longestCommonPrefix(names: string[]): string {
  if (names.length === 0) {
    return "";
  }
  const first = names[0]!;
  const last = names[names.length - 1]!;
  const firstLower = first.toLowerCase();
  const lastLower = last.toLowerCase();
  let end = 0;
  while (end < firstLower.length && firstLower[end] === lastLower[end]) {
    end += 1;
  }
  return first.slice(0, end);
}

export interface TabCycleState {
  /** Text the user had typed before this Tab cycle. */
  baseQuery: string;
  /** Index of the name currently shown, or -1 after a prefix extension. */
  index: number;
}

export interface TabCompleteResult {
  query: string;
  state: TabCycleState | null;
}

export function tabCompleteAdvance(
  query: string,
  candidates: string[],
  state: TabCycleState | null,
): TabCompleteResult {
  if (state) {
    const matches = namesStartingWith(state.baseQuery, candidates);
    if (matches.length === 0) {
      return { query, state: null };
    }
    let nextIndex = (state.index + 1) % matches.length;
    if (matches.length > 1 && matches[nextIndex] === query) {
      nextIndex = (nextIndex + 1) % matches.length;
    }
    return {
      query: matches[nextIndex]!,
      state: { baseQuery: state.baseQuery, index: nextIndex },
    };
  }

  const matches = namesStartingWith(query, candidates);
  if (matches.length === 0) {
    return { query, state: null };
  }

  const prefix = longestCommonPrefix(matches);
  if (prefix.length > query.length) {
    return {
      query: prefix,
      state: { baseQuery: query, index: -1 },
    };
  }

  const startIndex = matches.length > 1 && matches[0]!.toLowerCase() === query.trim().toLowerCase() ? 1 : 0;
  return {
    query: matches[startIndex]!,
    state: { baseQuery: query, index: startIndex },
  };
}
