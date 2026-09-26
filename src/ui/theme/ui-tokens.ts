import { oneDark } from "./one-dark.js";
import type { HintRole, SuffixRole } from "../labels.js";

export const ui = {
  /** Repo / branch names — highest contrast. */
  listName: oneDark.bright,
  listNameOnSelection: oneDark.bright,
  filter: oneDark.bright,
  screenTitle: oneDark.blue,
  border: oneDark.border,
  selectionBg: oneDark.selection,
  scrollAffordance: oneDark.comment,
  footer: oneDark.comment,
  progressLog: oneDark.comment,
  muted: oneDark.comment,
  status: {
    success: oneDark.green,
    inactive: oneDark.comment,
    info: oneDark.blue,
    caution: oneDark.yellow,
  },
} as const;

export function suffixColor(role: SuffixRole | undefined, onSelectedRow: boolean): string {
  if (onSelectedRow) {
    return ui.listNameOnSelection;
  }
  switch (role) {
    case "cloned":
      return ui.status.success;
    case "not-cloned":
      return ui.status.inactive;
    case "default":
      return ui.status.info;
    default:
      return ui.muted;
  }
}

export function hintColor(role: HintRole | undefined, onSelectedRow: boolean): string {
  if (onSelectedRow) {
    return ui.listNameOnSelection;
  }
  return role === "legacy" ? ui.status.caution : ui.muted;
}
