import { fuzzyFilter } from "./fuzzy-filter.js";

function longestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) {
    return "";
  }
  const sorted = [...strings].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const firstLower = first.toLowerCase();
  const lastLower = last.toLowerCase();
  let i = 0;
  while (i < firstLower.length && firstLower[i] === lastLower[i]) {
    i += 1;
  }
  return first.slice(0, i);
}

function startsWithQuery(candidate: string, query: string): boolean {
  return candidate.toLowerCase().startsWith(query.trim().toLowerCase());
}

function matchingCandidates(query: string, candidates: string[]): string[] {
  const unique = [...new Set(candidates)];
  const prefixMatches = unique.filter((candidate) => startsWithQuery(candidate, query));
  const pool =
    prefixMatches.length > 0 ? prefixMatches : fuzzyFilter(unique, query, (name) => name);
  return pool.sort((a, b) => a.localeCompare(b));
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
        index: index >= 0 ? index : -1,
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
