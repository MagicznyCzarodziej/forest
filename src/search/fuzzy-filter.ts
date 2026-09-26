export function fuzzyScore(text: string, query: string): number {
  if (!query) {
    return 1;
  }

  const hay = text.toLowerCase();
  const needle = query.toLowerCase();
  let score = 0;
  let hayIndex = 0;
  let consecutive = 0;
  let lastMatchIndex = -1;

  for (const char of needle) {
    let found = false;
    while (hayIndex < hay.length) {
      if (hay[hayIndex] === char) {
        const gap = lastMatchIndex === -1 ? 0 : hayIndex - lastMatchIndex - 1;
        consecutive = gap === 0 ? consecutive + 1 : 0;
        score += 10 + consecutive * 5 - Math.min(gap, 5);
        lastMatchIndex = hayIndex;
        hayIndex += 1;
        found = true;
        break;
      }
      hayIndex += 1;
    }
    if (!found) {
      return 0;
    }
  }

  if (hay.startsWith(needle)) {
    score += 20;
  }

  return score;
}

export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getLabel: (item: T) => string,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [...items];
  }

  return items
    .map((item) => ({ item, score: fuzzyScore(getLabel(item), trimmed) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item);
}
