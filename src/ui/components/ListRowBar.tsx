import { memo } from "react";
import { Text } from "ink";
import {
  HINT_COLUMN_WIDTH,
  ICON_END_MARGIN,
  hintIcon,
  SUFFIX_COLUMN_WIDTH,
  suffixIcon,
} from "../labels.js";
import type { HintRole, SuffixRole } from "../labels.js";
import { hintColor, suffixColor, ui } from "../theme/ui-tokens.js";
import { padEndVisible, padStartVisible } from "../text-width.js";

export interface ListRowData {
  id: string;
  primary: string;
  /** When set, appended to `primary` (e.g. Opening...). */
  statusText?: string;
  suffixRole?: SuffixRole;
  hintRole?: HintRole;
}

interface ListRowBarProps {
  row: ListRowData;
  selected: boolean;
  active: boolean;
  contentWidth: number;
  showSuffixColumn: boolean;
  showHintColumn: boolean;
}

function buildRowParts(props: ListRowBarProps): {
  titlePart: string;
  suffixPart: string;
  hintPart: string;
  endMarginPart: string;
} {
  const { row, selected, contentWidth, showSuffixColumn, showHintColumn } = props;
  const suffixWidth = showSuffixColumn ? SUFFIX_COLUMN_WIDTH : 0;
  const hintWidth = showHintColumn ? HINT_COLUMN_WIDTH : 0;
  const endMargin = showSuffixColumn || showHintColumn ? ICON_END_MARGIN : 0;
  const marker = selected ? "› " : "  ";
  const titleWidth = contentWidth - suffixWidth - hintWidth - endMargin;
  const titleLabel = row.statusText
    ? `${row.primary}  ${row.statusText}`
    : row.primary;
  const titlePart = padEndVisible(`${marker}${titleLabel}`, titleWidth);
  const suffixPart = showSuffixColumn
    ? padStartVisible(suffixIcon(row.suffixRole), suffixWidth)
    : "";
  const hintPart = showHintColumn
    ? padStartVisible(hintIcon(row.hintRole), hintWidth)
    : "";
  return { titlePart, suffixPart, hintPart, endMarginPart: " ".repeat(endMargin) };
}

function rowPropsEqual(a: ListRowBarProps, b: ListRowBarProps): boolean {
  return (
    a.row.id === b.row.id &&
    a.row.primary === b.row.primary &&
    a.row.statusText === b.row.statusText &&
    a.row.suffixRole === b.row.suffixRole &&
    a.row.hintRole === b.row.hintRole &&
    a.selected === b.selected &&
    a.active === b.active &&
    a.contentWidth === b.contentWidth &&
    a.showSuffixColumn === b.showSuffixColumn &&
    a.showHintColumn === b.showHintColumn
  );
}

/** One Ink text node per row — stable structure for fast scrolling. */
export const ListRowBar = memo(function ListRowBar(props: ListRowBarProps) {
  const highlighted = props.active && props.selected;
  const { titlePart, suffixPart, hintPart, endMarginPart } = buildRowParts(props);

  return (
    <Text backgroundColor={highlighted ? ui.selectionBg : undefined}>
      <Text color={ui.listName}>{titlePart}</Text>
      {props.showSuffixColumn ? (
        <Text color={suffixColor(props.row.suffixRole, highlighted)}>{suffixPart}</Text>
      ) : null}
      {props.showHintColumn ? (
        <Text color={hintColor(props.row.hintRole, highlighted)}>{hintPart}</Text>
      ) : null}
      {endMarginPart ? <Text>{endMarginPart}</Text> : null}
    </Text>
  );
}, rowPropsEqual);
