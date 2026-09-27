export function sortBranches(branches: string[], defaultBranch: string): string[] {
  const unique = [...new Set(branches)];
  return unique.sort((a, b) => {
    if (a === defaultBranch) return -1;
    if (b === defaultBranch) return 1;
    return a.localeCompare(b);
  });
}
