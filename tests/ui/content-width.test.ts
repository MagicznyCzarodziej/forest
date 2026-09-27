import { describe, expect, it } from 'vitest';
import {
  horizontalPadding,
  MAX_PANEL_WIDTH,
  resolveInnerContentWidth,
  resolvePanelWidth,
} from '../../src/ui/layout/content-width';

describe('content width layout', () => {
  it('caps panel width at max', () => {
    expect(resolvePanelWidth(200)).toBe(MAX_PANEL_WIDTH);
    expect(MAX_PANEL_WIDTH).toBe(96);
  });

  it('inner width accounts for side borders and padding', () => {
    expect(resolveInnerContentWidth(96)).toBe(92);
  });

  it('centers with padding', () => {
    expect(horizontalPadding(200, 96)).toBe(52);
  });
});
