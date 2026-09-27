import { describe, expect, it } from 'vitest';
import {
  padEnd,
  padStart,
  visibleWidth,
  normalizeTerminalLine,
  wrapLinesForViewport,
  wrapToVisibleLines,
} from '../../src/ui/text-width';
import { ICON_END_MARGIN, rowIcons } from '../../src/ui/labels';

describe('visible text width', () => {
  it('pads using terminal display width', () => {
    expect(visibleWidth(rowIcons.legacyRoot)).toBe(1);
    expect(visibleWidth(padEnd('ab', 5))).toBe(5);
  });

  it('row columns sum to content width', () => {
    const contentWidth = 50;
    const suffixWidth = 2;
    const hintWidth = 2;
    const titleWidth = contentWidth - suffixWidth - hintWidth - ICON_END_MARGIN;
    const title = padEnd('› repository', titleWidth);
    const suffix = padStart(rowIcons.cloned, suffixWidth);
    const hint = padStart(rowIcons.legacyRoot, hintWidth);
    const endMargin = ' '.repeat(ICON_END_MARGIN);
    expect(visibleWidth(title)).toBe(titleWidth);
    expect(visibleWidth(title + suffix + hint + endMargin)).toBe(contentWidth);
    expect((title + suffix + hint + endMargin).endsWith(' ')).toBe(true);
  });

  it('wraps long lines to visible width without exceeding it', () => {
    const wrapped = wrapToVisibleLines('abcdefgh', 3);
    expect(wrapped).toEqual(['abc', 'def', 'gh']);
    for (const line of wrapped) {
      expect(visibleWidth(line)).toBeLessThanOrEqual(3);
    }
  });

  it('keeps viewport row count bounded after wrapping', () => {
    const lines = ['aaaa', 'bbbb', 'cccc'];
    expect(wrapLinesForViewport(lines, 2, 4)).toEqual(['bb', 'bb', 'cc', 'cc']);
    expect(wrapLinesForViewport(lines, 2, 4)).toHaveLength(4);
  });

  it('strips ansi and carriage-return progress fragments', () => {
    expect(normalizeTerminalLine('\u001B[31mold\u001B[0m\rnew')).toBe('new');
  });

  it('strips backspace control characters from git progress', () => {
    expect(normalizeTerminalLine('Receiving objects:  50%\b\b\b60%')).toBe(
      'Receiving objects:  50%60%',
    );
  });
});
