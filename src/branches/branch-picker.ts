import { fuzzyFilter } from '../search/fuzzy-filter.js';

export function sortBranches(branches: string[], defaultBranch: string): string[] {
  const unique = [...new Set(branches)];
  return unique.sort((a, b) => {
    if (a === defaultBranch) return -1;
    if (b === defaultBranch) return 1;
    return a.localeCompare(b);
  });
}

export function canConfirmBranchSelection(
  _allBranches: string[],
  query: string,
  filteredBranches: string[],
): boolean {
  if (filteredBranches.length === 0) {
    return false;
  }
  const trimmed = query.trim();
  if (!trimmed) {
    return true;
  }
  return filteredBranches.every(
    (branch) => fuzzyFilter([branch], trimmed, (name) => name).length > 0,
  );
}
