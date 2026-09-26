/** Terminal icons for row state (fixed width columns). */
export const rowIcons = {
  cloned: "✓",
  notCloned: "○",
  defaultBranch: "★",
  /** Root-level checkout (legacy layout, not .bare + worktrees). */
  legacyRoot: "⌂",
} as const;

const ICON_COLUMN_WIDTH = 2;

export const SUFFIX_COLUMN_WIDTH = ICON_COLUMN_WIDTH;
export const HINT_COLUMN_WIDTH = ICON_COLUMN_WIDTH;
/** Blank cells after the rightmost icon, inside the row background. */
export const ICON_END_MARGIN = 1;

export type SuffixRole = "cloned" | "not-cloned" | "default";
export type HintRole = "legacy";

export function suffixIcon(role: SuffixRole | undefined): string {
  switch (role) {
    case "cloned":
      return rowIcons.cloned;
    case "not-cloned":
      return rowIcons.notCloned;
    case "default":
      return rowIcons.defaultBranch;
    default:
      return " ";
  }
}

export function hintIcon(role: HintRole | undefined): string {
  return role === "legacy" ? rowIcons.legacyRoot : " ";
}
