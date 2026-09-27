import { padEnd, padStart } from '../../text-width';
import { ListRowBarProps } from './ListRowBar';

const ICON_COLUMN_WIDTH = 2;
export const SUFFIX_COLUMN_WIDTH = ICON_COLUMN_WIDTH;
export const HINT_COLUMN_WIDTH = ICON_COLUMN_WIDTH;
/** Blank cells after the rightmost icon, inside the row background. */
export const ICON_END_MARGIN = 1;

/** Terminal icons for row state (fixed width columns). */
export const rowIcons = {
  cloned: '✓',
  notCloned: '○',
  defaultBranch: '★',
  /** Root-level checkout (legacy layout, not .bare + worktrees). */
  legacyRoot: '⌂',
} as const;
export type SuffixRole = 'cloned' | 'not-cloned' | 'default';
export type HintRole = 'legacy';

export function suffixIcon(role: SuffixRole | undefined): string {
  switch (role) {
    case 'cloned':
      return rowIcons.cloned;
    case 'not-cloned':
      return rowIcons.notCloned;
    case 'default':
      return rowIcons.defaultBranch;
    default:
      return ' ';
  }
}

export function hintIcon(role: HintRole | undefined): string {
  return role === 'legacy' ? rowIcons.legacyRoot : ' ';
}

export function buildRowParts(props: ListRowBarProps): {
  titlePart: string;
  suffixPart: string;
  hintPart: string;
  endMarginPart: string;
} {
  const { row, isSelected, contentWidth, showSuffixColumn, showHintColumn } = props;

  const marker = isSelected ? '› ' : '  ';

  const suffixWidth = showSuffixColumn ? SUFFIX_COLUMN_WIDTH : 0;
  const hintWidth = showHintColumn ? HINT_COLUMN_WIDTH : 0;
  const endMargin = showSuffixColumn || showHintColumn ? ICON_END_MARGIN : 0;

  const titleWidth = contentWidth - suffixWidth - hintWidth - endMargin;
  const titleLabel = row.statusText ? `${row.primary}  ${row.statusText}` : row.primary;
  const titlePart = padEnd(`${marker}${titleLabel}`, titleWidth);

  const suffixPart = showSuffixColumn ? padStart(suffixIcon(row.suffixRole), suffixWidth) : '';
  const hintPart = showHintColumn ? padStart(hintIcon(row.hintRole), hintWidth) : '';

  const endMarginPart = ' '.repeat(endMargin);

  return { titlePart, suffixPart, hintPart, endMarginPart };
}
