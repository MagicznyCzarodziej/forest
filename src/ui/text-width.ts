import stringWidth from "string-width";

export function visibleWidth(text: string): number {
  return stringWidth(text);
}

export function truncateToVisibleWidth(text: string, maxWidth: number): string {
  if (maxWidth <= 0) {
    return "";
  }
  if (visibleWidth(text) <= maxWidth) {
    return text;
  }
  let result = "";
  for (const char of text) {
    const next = result + char;
    if (visibleWidth(next) > maxWidth) {
      break;
    }
    result = next;
  }
  return result;
}

export function padEndVisible(text: string, width: number): string {
  const w = visibleWidth(text);
  if (w >= width) {
    return truncateToVisibleWidth(text, width);
  }
  return text + " ".repeat(width - w);
}

export function padStartVisible(text: string, width: number): string {
  const w = visibleWidth(text);
  if (w >= width) {
    return truncateToVisibleWidth(text, width);
  }
  return " ".repeat(width - w) + text;
}
