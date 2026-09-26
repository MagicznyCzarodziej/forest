import { fuzzyScore } from "./fuzzy-filter.js";

function longestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) {
    return "";
  }
  const sorted = [...strings].sort();
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  let i = 0;
  while (i < first.length && first[i] === last[i]) {
    i += 1;
  }
  return first.slice(0, i);
}

export function matchingCandidates(query: string, candidates: string[]): string[] {
  return [...new Set(candidates)]
    .filter((c) => fuzzyScore(c, query) > 0)
    .sort((a, b) => a.localeCompare(b));
}

export interface TabCycleState {
  /** Query before the first Tab in this cycle (e.g. `lum`). */
  baseQuery: string;
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
    const matches = matchingCandidates(state.baseQuery, candidates);
    if (matches.length === 0) {
      return { query, state: null };
    }
    const nextIndex = (state.index + 1) % matches.length;
    return {
      query: matches[nextIndex]!,
      state: { baseQuery: state.baseQuery, index: nextIndex },
    };
  }

  const matches = matchingCandidates(query, candidates);
  if (matches.length === 0) {
    return { query, state: null };
  }
  if (matches.length === 1) {
    return { query: matches[0]!, state: null };
  }

  const prefix = longestCommonPrefix(matches);
  if (prefix.length > query.length) {
    const index = matches.findIndex((m) => m === prefix);
    return {
      query: prefix,
      state: {
        baseQuery: query,
        index: index >= 0 ? index : 0,
      },
    };
  }

  const exactIndex = matches.findIndex((m) => m === query);
  const startIndex = exactIndex >= 0 ? (exactIndex + 1) % matches.length : 0;
  return {
    query: matches[startIndex]!,
    state: { baseQuery: query, index: startIndex },
  };
}
