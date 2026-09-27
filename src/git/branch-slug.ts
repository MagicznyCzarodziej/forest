/** Maps a branch name to a safe worktree directory segment. */
export function branchToWorktreeSlug(branch: string): string {
  return branch.replace(/\//g, "-");
}
