import { homedir } from "node:os";
import { resolve } from "node:path";

export function expandPath(path: string, home = homedir()): string {
  const trimmed = path.trim();
  if (trimmed === "~") {
    return home;
  }
  if (trimmed.startsWith("~/")) {
    return resolve(home, trimmed.slice(2));
  }
  return resolve(trimmed);
}
