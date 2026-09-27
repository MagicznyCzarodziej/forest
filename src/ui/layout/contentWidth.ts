import { HINT_COLUMN_WIDTH, SUFFIX_COLUMN_WIDTH } from '../labels';

const MIN_APP_WIDTH = 48;
export const MAX_APP_WIDTH = 96;
const APP_HORIZONTAL_MARGIN_WIDTH = 4;
const APP_VERTICAL_BORDER_WIDTH = 1;
export const APP_HORIZONTAL_PADDING_WIDTH = 1;

export { SUFFIX_COLUMN_WIDTH, HINT_COLUMN_WIDTH };

export function resolveAppWidth(terminalColumns: number): number {
  return Math.min(
    MAX_APP_WIDTH,
    Math.max(MIN_APP_WIDTH, terminalColumns - APP_HORIZONTAL_MARGIN_WIDTH),
  );
}

export function resolveContentWidth(appWidth: number): number {
  return appWidth - APP_VERTICAL_BORDER_WIDTH * 2 - APP_HORIZONTAL_PADDING_WIDTH * 2;
}

export function horizontalPadding(terminalColumns: number, appWidth: number): number {
  return Math.max(0, Math.floor((terminalColumns - appWidth) / 2));
}
