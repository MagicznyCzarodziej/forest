import { describe, expect, it, vi } from 'vitest';
import {
  disableAlternateScrollMode,
  enableAlternateScrollMode,
} from '../../src/infrastructure/terminal/alternate-scroll-mode';

describe('alternate scroll mode', () => {
  it('writes DEC 1007 escapes on a TTY', () => {
    const write = vi.fn();
    const stream = { isTTY: true, write } as NodeJS.WriteStream;

    enableAlternateScrollMode(stream);
    expect(write).toHaveBeenCalledWith('\x1b[?1007h');

    disableAlternateScrollMode(stream);
    expect(write).toHaveBeenCalledWith('\x1b[?1007l');
  });

  it('skips when not a TTY', () => {
    const write = vi.fn();
    const stream = { isTTY: false, write } as NodeJS.WriteStream;

    enableAlternateScrollMode(stream);
    disableAlternateScrollMode(stream);

    expect(write).not.toHaveBeenCalled();
  });
});
