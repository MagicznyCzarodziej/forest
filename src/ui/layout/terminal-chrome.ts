/** Side borders only — no top/bottom frame lines. */
export const BORDER_LINES = 0;
export const FOOTER_LINES = 1;
export const SUBTITLE_LINES = 1;
export const PICKER_SEARCH_LINES = 1;

export function panelRenderHeight(terminalRows: number | undefined): number {
  return terminalRows ?? 24;
}

export function listDataRowSlots(
  terminalRows: number | undefined,
  withSubtitle: boolean,
): number {
  const rows = panelRenderHeight(terminalRows);
  const chrome =
    BORDER_LINES +
    FOOTER_LINES +
    PICKER_SEARCH_LINES +
    (withSubtitle ? SUBTITLE_LINES : 0);
  return Math.max(1, rows - chrome);
}

export function shellBodyHeight(
  terminalRows: number | undefined,
  withSubtitle: boolean,
): number {
  const panelHeight = panelRenderHeight(terminalRows);
  return Math.max(
    1,
    panelHeight - FOOTER_LINES - (withSubtitle ? SUBTITLE_LINES : 0),
  );
}
