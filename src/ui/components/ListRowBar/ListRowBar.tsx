import { memo } from 'react';
import { Text } from 'ink';
import { hintColor, suffixColor, ui } from '../../theme/uiTokens';
import { buildRowParts, HintRole, SuffixRole } from './buildRowParts';

export interface ListRowBarProps {
  row: ListRowData;
  isSelected: boolean;
  contentWidth: number;
  showSuffixColumn: boolean;
  showHintColumn: boolean;
}

export interface ListRowData {
  id: string;
  primary: string;
  /** When set, appended to `primary` (e.g. Opening...). */
  statusText?: string;
  suffixRole?: SuffixRole;
  hintRole?: HintRole;
}

function areRowPropsEqual(a: ListRowBarProps, b: ListRowBarProps): boolean {
  return (
    a.row.id === b.row.id &&
    a.row.primary === b.row.primary &&
    a.row.statusText === b.row.statusText &&
    a.row.suffixRole === b.row.suffixRole &&
    a.row.hintRole === b.row.hintRole &&
    a.isSelected === b.isSelected &&
    a.contentWidth === b.contentWidth &&
    a.showSuffixColumn === b.showSuffixColumn &&
    a.showHintColumn === b.showHintColumn
  );
}

export const ListRowBar = memo(function ListRowBar(props: ListRowBarProps) {
  const { titlePart, suffixPart, hintPart, endMarginPart } = buildRowParts(props);

  return (
    <Text backgroundColor={props.isSelected ? ui.selectionBg : undefined}>
      <Text color={ui.listName}>{titlePart}</Text>

      {props.showSuffixColumn ? (
        <Text color={suffixColor(props.row.suffixRole, props.isSelected)}>{suffixPart}</Text>
      ) : null}

      {props.showHintColumn ? (
        <Text color={hintColor(props.row.hintRole, props.isSelected)}>{hintPart}</Text>
      ) : null}

      {endMarginPart ? <Text>{endMarginPart}</Text> : null}
    </Text>
  );
}, areRowPropsEqual);
