import { describe, expect, it } from 'vitest';
import { padEndVisible, padStartVisible, visibleWidth } from '../../src/ui/text-width';
import { ICON_END_MARGIN, rowIcons } from '../../src/ui/labels';

describe('visible text width', () => {
  it('pads using terminal display width', () => {
    expect(visibleWidth(rowIcons.legacyRoot)).toBe(1);
    expect(visibleWidth(padEndVisible('ab', 5))).toBe(5);
  });

  it('row columns sum to content width', () => {
    const contentWidth = 50;
    const suffixWidth = 2;
    const hintWidth = 2;
    const titleWidth = contentWidth - suffixWidth - hintWidth - ICON_END_MARGIN;
    const title = padEndVisible('› repository', titleWidth);
    const suffix = padStartVisible(rowIcons.cloned, suffixWidth);
    const hint = padStartVisible(rowIcons.legacyRoot, hintWidth);
    const endMargin = ' '.repeat(ICON_END_MARGIN);
    expect(visibleWidth(title)).toBe(titleWidth);
    expect(visibleWidth(title + suffix + hint + endMargin)).toBe(contentWidth);
    expect((title + suffix + hint + endMargin).endsWith(' ')).toBe(true);
  });
});
