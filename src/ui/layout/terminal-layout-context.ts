import { createContext } from "react";

export interface TerminalLayoutContextValue {
  terminalColumns: number;
  terminalRows: number;
  panelWidth: number;
  contentWidth: number;
  paddingX: number;
  bodyHeight: number;
  /** Visible data rows in the list (excludes ↑/↓ scroll lines). */
  listViewportRows: number;
}

export const TerminalLayoutContext = createContext<TerminalLayoutContextValue>({
  terminalColumns: 80,
  terminalRows: 24,
  panelWidth: 96,
  contentWidth: 92,
  paddingX: 0,
  bodyHeight: 20,
  listViewportRows: 18,
});
