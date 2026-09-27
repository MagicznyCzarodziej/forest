export const FOOTER_LINES = 1;
export const SUBTITLE_LINES = 1;
export const PICKER_SEARCH_LINES = 1;

export function resolveAppHeight(terminalRows: number | undefined): number {
  return terminalRows ?? 24;
}

export function listDataRowSlots(terminalRows: number | undefined, hasSubtitle: boolean): number {
  const rows = resolveAppHeight(terminalRows);
  const chrome = FOOTER_LINES + PICKER_SEARCH_LINES + (hasSubtitle ? SUBTITLE_LINES : 0);
  return Math.max(1, rows - chrome);
}

export function resolveContentHeight(
  terminalRows: number | undefined,
  hasSubtitle: boolean,
): number {
  const appHeight = resolveAppHeight(terminalRows);
  return Math.max(1, appHeight - FOOTER_LINES - (hasSubtitle ? SUBTITLE_LINES : 0));
}
