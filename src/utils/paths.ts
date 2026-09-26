import { resolve, sep } from "node:path";

function normalizePath(path: string): string {
  const resolved = resolve(path);
  return resolved.endsWith(sep) ? resolved.slice(0, -1) : resolved;
}

export function isPathInside(parent: string, child: string): boolean {
  const parentNorm = normalizePath(parent);
  const childNorm = normalizePath(child);
  if (childNorm === parentNorm) {
    return true;
  }
  return childNorm.startsWith(parentNorm + sep);
}
