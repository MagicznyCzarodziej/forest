import { describe, expect, it } from 'vitest';
import { listDataRowSlots } from '../../src/ui/layout/terminalChrome';

describe('terminal chrome metrics', () => {
  it('allocates list rows from terminal height', () => {
    expect(listDataRowSlots(40, true)).toBe(37);
  });
});
