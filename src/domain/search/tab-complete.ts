function namesStartingWith(query: string, candidates: string[]): string[] {
  const needle = query.trim().toLowerCase();
  const seen = new Set<string>();
  const matches: string[] = [];
  for (const name of candidates) {
    if (seen.has(name)) {
      continue;
    }
    if (name.toLowerCase().startsWith(needle)) {
      seen.add(name);
      matches.push(name);
    }
  }
  return matches;
}

function longestCommonPrefix(names: string[]): string {
  if (names.length === 0) {
    return '';
  }
  let end = names[0].length;
  for (let i = 1; i < names.length; i += 1) {
    const name = names[i];
    const nameLower = name.toLowerCase();
    let shared = 0;
    while (
      shared < end &&
      shared < nameLower.length &&
      names[0].toLowerCase()[shared] === nameLower[shared]
    ) {
      shared += 1;
    }
    end = shared;
    if (end === 0) {
      break;
    }
  }
  return names[0].slice(0, end);
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

/** Gray suffix shown after the query — what Tab would append or replace toward next. */
export function tabCompleteHint(
  query: string,
  candidates: string[],
  state: TabCycleState | null,
): string {
  if (query.trim().length === 0) {
    return '';
  }
  const { query: completed } = tabCompleteAdvance(query, candidates, state);
  const queryLower = query.toLowerCase();
  const completedLower = completed.toLowerCase();
  if (!completedLower.startsWith(queryLower) || completed.length <= query.length) {
    return '';
  }
  return completed.slice(query.length);
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
      query: matches[nextIndex],
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

  const startIndex =
    matches.length > 1 && matches[0].toLowerCase() === query.trim().toLowerCase() ? 1 : 0;
  return {
    query: matches[startIndex],
    state: { baseQuery: query, index: startIndex },
  };
}
