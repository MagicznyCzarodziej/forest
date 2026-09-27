import { describe, expect, it } from 'vitest';
import { computeListViewport } from '../../src/ui/list-viewport';
import { listDataRowSlots } from '../../src/ui/layout/terminal-chrome';

describe('computeListViewport', () => {
  const viewport = 10;

  it('shows from start when selection is in first window', () => {
    expect(computeListViewport(3, 50, viewport)).toEqual({ offset: 0, visibleCount: 10 });
  });

  it('scrolls down when selection passes the window', () => {
    expect(computeListViewport(15, 50, viewport)).toEqual({ offset: 6, visibleCount: 10 });
  });

  it('pins to end when selection is near the bottom', () => {
    expect(computeListViewport(49, 50, viewport)).toEqual({ offset: 40, visibleCount: 10 });
  });

  it('returns full list when shorter than viewport', () => {
    expect(computeListViewport(2, 5, viewport)).toEqual({ offset: 0, visibleCount: 5 });
  });
});

describe('listDataRowSlots', () => {
  it('uses terminal height without an artificial cap', () => {
    expect(listDataRowSlots(40, true)).toBeGreaterThan(10);
  });
});
