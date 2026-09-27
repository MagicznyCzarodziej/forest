import { describe, expect, it } from 'vitest';
import { jumpListIndex, moveListIndex } from '../../src/ui/list-navigation';

describe('moveListIndex', () => {
  const len = 5;

  it('clamps at zero when moving up', () => {
    expect(moveListIndex(0, 'up', len)).toBe(0);
  });

  it('clamps at last index when moving down', () => {
    expect(moveListIndex(4, 'down', len)).toBe(4);
  });

  it('moves within range', () => {
    expect(moveListIndex(2, 'down', len)).toBe(3);
  });
});

describe('jumpListIndex', () => {
  it('goes to the first and last row', () => {
    expect(jumpListIndex('home', 5)).toBe(0);
    expect(jumpListIndex('end', 5)).toBe(4);
  });

  it('stays at zero when the list is empty', () => {
    expect(jumpListIndex('home', 0)).toBe(0);
    expect(jumpListIndex('end', 0)).toBe(0);
  });
});
