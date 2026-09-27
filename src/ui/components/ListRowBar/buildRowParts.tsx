import {
  HINT_COLUMN_WIDTH,
  hintIcon,
  ICON_END_MARGIN,
  SUFFIX_COLUMN_WIDTH,
  suffixIcon,
} from '../../labels';
import { padEnd, padStart } from '../../text-width';
import { ListRowBarProps } from './ListRowBar';

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
