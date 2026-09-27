import { describe, expect, it } from 'vitest';
import { expandPath } from '../../src/utils/expand-path';

describe('expandPath', () => {
  it('expands ~ and ~/paths', () => {
    expect(expandPath('~/dev', '/home/me')).toBe('/home/me/dev');
    expect(expandPath('~', '/home/me')).toBe('/home/me');
  });
});
