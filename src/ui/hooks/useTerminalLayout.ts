import { useContext } from "react";
import { TerminalLayoutContext } from "../layout/terminal-layout-context.js";

export function useTerminalLayout() {
  return useContext(TerminalLayoutContext);
}
