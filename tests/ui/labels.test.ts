import { describe, expect, it } from 'vitest';
import {
  HINT_COLUMN_WIDTH,
  hintIcon,
  ICON_END_MARGIN,
  rowIcons,
  SUFFIX_COLUMN_WIDTH,
  suffixIcon,
} from '../../src/ui/labels';

describe('row icons', () => {
  it('uses compact icon columns', () => {
    expect(SUFFIX_COLUMN_WIDTH).toBe(2);
    expect(HINT_COLUMN_WIDTH).toBe(2);
    expect(ICON_END_MARGIN).toBe(1);
  });

  it('maps roles to icons', () => {
    expect(suffixIcon('cloned')).toBe(rowIcons.cloned);
    expect(suffixIcon('not-cloned')).toBe(rowIcons.notCloned);
    expect(hintIcon('legacy')).toBe(rowIcons.legacyRoot);
  });
});
