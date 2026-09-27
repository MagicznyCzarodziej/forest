import { describe, expect, it } from 'vitest';
import {
  horizontalPadding,
  MAX_APP_WIDTH,
  resolveContentWidth,
  resolveAppWidth,
} from '../../src/ui/layout/contentWidth';

describe('content width layout', () => {
  it('caps panel width at max', () => {
    expect(resolveAppWidth(200)).toBe(MAX_APP_WIDTH);
    expect(MAX_APP_WIDTH).toBe(96);
  });

  it('inner width accounts for side borders and padding', () => {
    expect(resolveContentWidth(96)).toBe(92);
  });

  it('centers with padding', () => {
    expect(horizontalPadding(200, 96)).toBe(52);
  });
});
