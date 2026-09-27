import { oneDarkTheme } from './oneDarkTheme';
import { HintRole, SuffixRole } from '../components/ListRowBar/buildRowParts';

export const ui = {
  /** repository / branch names — highest contrast. */
  listName: oneDarkTheme.bright,
  listNameOnSelection: oneDarkTheme.bright,
  filter: oneDarkTheme.bright,
  screenTitle: oneDarkTheme.blue,
  border: oneDarkTheme.border,
  selectionBg: oneDarkTheme.selection,
  scrollAffordance: oneDarkTheme.comment,
  footer: oneDarkTheme.comment,
  progressLog: oneDarkTheme.comment,
  muted: oneDarkTheme.comment,
  status: {
    success: oneDarkTheme.green,
    inactive: oneDarkTheme.comment,
    info: oneDarkTheme.blue,
    caution: oneDarkTheme.yellow,
  },
} as const;

export function suffixColor(role: SuffixRole | undefined, onSelectedRow: boolean): string {
  if (onSelectedRow) {
    return ui.listNameOnSelection;
  }
  switch (role) {
    case 'cloned':
      return ui.status.success;
    case 'not-cloned':
      return ui.status.inactive;
    case 'default':
      return ui.status.info;
    default:
      return ui.muted;
  }
}

export function hintColor(role: HintRole | undefined, onSelectedRow: boolean): string {
  if (onSelectedRow) {
    return ui.listNameOnSelection;
  }
  return role === 'legacy' ? ui.status.caution : ui.muted;
}
