export interface ListViewport {
  offset: number;
  visibleCount: number;
}

export function computeListViewport(
  selectedIndex: number,
  itemCount: number,
  viewportSize: number,
): ListViewport {
  if (itemCount === 0 || viewportSize <= 0) {
    return { offset: 0, visibleCount: 0 };
  }

  const visibleCount = Math.min(viewportSize, itemCount);
  if (itemCount <= visibleCount) {
    return { offset: 0, visibleCount };
  }

  let offset = selectedIndex - visibleCount + 1;
  if (offset < 0) {
    offset = 0;
  }
  if (offset > itemCount - visibleCount) {
    offset = itemCount - visibleCount;
  }

  return { offset, visibleCount };
}
