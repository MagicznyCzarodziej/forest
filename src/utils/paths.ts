import { resolve, sep } from 'node:path';

function normalizePath(path: string): string {
  const resolved = resolve(path);
  return resolved.endsWith(sep) ? resolved.slice(0, -1) : resolved;
}

export function isPathInside(parent: string, child: string): boolean {
  const normalizedParent = normalizePath(parent);
  const normalizedChild = normalizePath(child);

  if (normalizedChild === normalizedParent) {
    return true;
  }
  return normalizedChild.startsWith(normalizedParent + sep);
}
