import { createContext } from 'react';

export interface TerminalLayoutContextValue {
  terminalColumns: number;
  terminalRows: number;
  appWidth: number;
  contentWidth: number;
  paddingX: number;
  contentHeight: number;
  /** Visible data rows in the list (excludes ↑/↓ scroll lines). */
  listViewportRows: number;
}

export const TerminalLayoutContext = createContext<TerminalLayoutContextValue>({
  terminalColumns: 80,
  terminalRows: 24,
  appWidth: 96,
  contentWidth: 92,
  contentHeight: 20,
  paddingX: 0,
  listViewportRows: 18,
});
