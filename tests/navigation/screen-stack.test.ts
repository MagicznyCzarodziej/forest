import { describe, expect, it } from 'vitest';
import { popScreen, pushScreen, type ScreenState } from '../../src/navigation/screen-stack.js';

describe('screen stack', () => {
  it('pushes a new screen onto the stack', () => {
    const initial: ScreenState[] = [{ type: 'repos' }];
    const next = pushScreen(initial, { type: 'worktrees', repoName: 'x', repoPath: '/x' });
    expect(next).toHaveLength(2);
    expect(next[1]?.type).toBe('worktrees');
  });

  it('pops the last screen', () => {
    const stack: ScreenState[] = [
      { type: 'repos' },
      { type: 'worktrees', repoName: 'x', repoPath: '/x' },
    ];
    expect(popScreen(stack)).toHaveLength(1);
  });

  it('does not pop below the minimum depth', () => {
    const stack: ScreenState[] = [{ type: 'repos' }];
    expect(popScreen(stack, 1)).toEqual(stack);
  });

  it('allows a single-screen entry at worktrees', () => {
    const stack: ScreenState[] = [{ type: 'worktrees', repoName: 'x', repoPath: '/x' }];
    expect(popScreen(stack, 1)).toEqual(stack);
  });
});
