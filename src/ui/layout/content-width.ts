import { HINT_COLUMN_WIDTH, SUFFIX_COLUMN_WIDTH } from '../labels.js';

/** ~2/3 of the previous 144-column panel. */
export const MAX_PANEL_WIDTH = 96;

export const INNER_PADDING_X = 1;

/** Left/right `borderStyle="single"` columns inside the panel box. */
export const PANEL_BORDER_X = 1;

export { SUFFIX_COLUMN_WIDTH, HINT_COLUMN_WIDTH };

export function resolvePanelWidth(terminalColumns: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(48, terminalColumns - 4));
}

export function resolveInnerContentWidth(panelWidth: number): number {
  return panelWidth - PANEL_BORDER_X * 2 - INNER_PADDING_X * 2;
}

export function horizontalPadding(terminalColumns: number, panelWidth: number): number {
  return Math.max(0, Math.floor((terminalColumns - panelWidth) / 2));
}
