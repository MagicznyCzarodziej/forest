export type ScreenState =
  | { type: "repos" }
  | { type: "worktrees"; repoName: string; repoPath: string }
  | { type: "branches"; repoName: string; repoPath: string; newBranchName: string }
  | { type: "confirm-clone"; repoName: string }
  | { type: "confirm-convert"; repoName: string; repoPath: string }
  | { type: "progress"; title: string; message: string };

export function pushScreen(stack: ScreenState[], screen: ScreenState): ScreenState[] {
  return [...stack, screen];
}

export function popScreen(stack: ScreenState[], minimumLength = 1): ScreenState[] {
  if (stack.length <= minimumLength) {
    return stack;
  }
  return stack.slice(0, -1);
}

export function currentScreen(stack: ScreenState[]): ScreenState {
  return stack[stack.length - 1] ?? { type: "repos" };
}
