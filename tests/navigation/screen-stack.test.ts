import { describe, expect, it } from 'vitest';
import {
  finishConfirmFlowToWorktrees,
  popOverlayScreens,
  popScreen,
  pushScreen,
  pushWorktreesScreen,
  type ScreenState,
} from '../../src/ui/navigation/navigation';

describe('screen stack', () => {
  it('pushes a new screen onto the stack', () => {
    const initial: ScreenState[] = [{ type: 'repositories' }];
    const next = pushScreen(initial, {
      type: 'worktrees',
      repositoryName: 'x',
      repositoryPath: '/x',
    });
    expect(next).toHaveLength(2);
    expect(next[1]?.type).toBe('worktrees');
  });

  it('pops the last screen', () => {
    const stack: ScreenState[] = [
      { type: 'repositories' },
      { type: 'worktrees', repositoryName: 'x', repositoryPath: '/x' },
    ];
    expect(popScreen(stack)).toHaveLength(1);
  });

  it('does not pop below the minimum depth', () => {
    const stack: ScreenState[] = [{ type: 'repositories' }];
    expect(popScreen(stack, 1)).toEqual(stack);
  });

  it('pops worktrees back to repositories when repositories is on the stack below', () => {
    const stack: ScreenState[] = [
      { type: 'repositories' },
      { type: 'worktrees', repositoryName: 'x', repositoryPath: '/x' },
    ];
    expect(popScreen(stack, 1)).toEqual([{ type: 'repositories' }]);
  });

  it('popOverlayScreens removes confirm and progress overlays', () => {
    const stack: ScreenState[] = [
      { type: 'repositories' },
      { type: 'confirm-clone', repositoryName: 'app' },
      { type: 'progress', title: 'Cloning app', message: '' },
    ];
    expect(popOverlayScreens(stack)).toEqual([{ type: 'repositories' }]);
  });

  it('pushWorktreesScreen appends a worktrees screen', () => {
    const stack: ScreenState[] = [{ type: 'repositories' }];
    expect(pushWorktreesScreen(stack, 'app', '/forest/app')).toEqual([
      { type: 'repositories' },
      { type: 'worktrees', repositoryName: 'app', repositoryPath: '/forest/app' },
    ]);
  });

  it('finishConfirmFlowToWorktrees pops overlays then pushes worktrees', () => {
    const stack: ScreenState[] = [
      { type: 'repositories' },
      { type: 'confirm-convert', repositoryName: 'app', repositoryPath: '/legacy/app' },
      { type: 'progress', title: 'Converting app', message: '' },
    ];
    expect(finishConfirmFlowToWorktrees(stack, 'app', '/forest/app')).toEqual([
      { type: 'repositories' },
      { type: 'worktrees', repositoryName: 'app', repositoryPath: '/forest/app' },
    ]);
  });
});
