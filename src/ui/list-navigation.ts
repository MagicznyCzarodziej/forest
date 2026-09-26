export function jumpListIndex(edge: "home" | "end", length: number): number {
  if (length <= 0) {
    return 0;
  }
  return edge === "home" ? 0 : length - 1;
}

export function moveListIndex(
  current: number,
  direction: "up" | "down",
  length: number,
): number {
  if (length <= 0) {
    return 0;
  }
  if (direction === "up") {
    return Math.max(0, current - 1);
  }
  return Math.min(length - 1, current + 1);
}
