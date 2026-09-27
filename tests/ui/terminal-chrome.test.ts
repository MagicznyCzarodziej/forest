import { describe, expect, it } from 'vitest';
import { listDataRowSlots } from '../../src/ui/layout/terminal-chrome.js';

describe('terminal chrome metrics', () => {
  it('allocates list rows from terminal height', () => {
    expect(listDataRowSlots(40, true)).toBe(37);
  });
});
