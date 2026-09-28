import { describe, expect, it, vi } from 'vitest';
import {
  type AlternateScrollStream,
  disableAlternateScrollMode,
  enableAlternateScrollMode,
} from '../../../src/infrastructure/terminal/alternateScrollMode';

describe('alternate scroll mode', () => {
  it('writes DEC 1007 escapes on a TTY', () => {
    const write = vi.fn<(chunk: string) => boolean>(() => true);
    const stream: AlternateScrollStream = { isTTY: true, write };

    enableAlternateScrollMode(stream);
    expect(write).toHaveBeenCalledWith('\x1b[?1007h');

    disableAlternateScrollMode(stream);
    expect(write).toHaveBeenCalledWith('\x1b[?1007l');
  });

  it('skips when not a TTY', () => {
    const write = vi.fn<(chunk: string) => boolean>(() => true);
    const stream: AlternateScrollStream = { isTTY: false, write };

    enableAlternateScrollMode(stream);
    disableAlternateScrollMode(stream);

    expect(write).not.toHaveBeenCalled();
  });
});
