export type ScreenState =
  | { type: 'repositories' }
  | { type: 'worktrees'; repositoryName: string; repositoryPath: string }
  | { type: 'branches'; repositoryName: string; repositoryPath: string; newBranchName: string }
  | { type: 'confirm-clone'; repositoryName: string }
  | { type: 'confirm-convert'; repositoryName: string; repositoryPath: string }
  | { type: 'progress'; title: string; message: string };

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
  return stack[stack.length - 1] ?? { type: 'repositories' };
}

/** Pops confirm + progress overlays, keeping at least `minimumLength` screens. */
export function popOverlayScreens(stack: ScreenState[], minimumLength = 1): ScreenState[] {
  return popScreen(popScreen(stack, minimumLength), minimumLength);
}

export function pushWorktreesScreen(
  stack: ScreenState[],
  repositoryName: string,
  repositoryPath: string,
): ScreenState[] {
  return pushScreen(stack, { type: 'worktrees', repositoryName, repositoryPath });
}

export function finishConfirmFlowToWorktrees(
  stack: ScreenState[],
  repositoryName: string,
  repositoryPath: string,
  minimumLength = 1,
): ScreenState[] {
  return pushWorktreesScreen(
    popOverlayScreens(stack, minimumLength),
    repositoryName,
    repositoryPath,
  );
}
