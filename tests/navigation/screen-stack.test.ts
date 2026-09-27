import { describe, expect, it } from 'vitest';
import { popScreen, pushScreen, type ScreenState } from '../../src/navigation/screen-stack';

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
});
