/** Maps a branch name to a safe worktree directory segment (repo__segment). */
export function branchToWorktreeSlug(branch: string): string {
  return branch.replace(/\//g, "-");
}
