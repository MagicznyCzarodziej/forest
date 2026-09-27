import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';

export function normalizeTerminalLine(text: string): string {
  const segment = text.includes('\r') ? text.slice(text.lastIndexOf('\r') + 1) : text;
  return stripControlCharacters(stripAnsi(segment));
}

function stripControlCharacters(text: string): string {
  let result = '';
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 0x09) {
      result += ' ';
      continue;
    }
    if (code < 0x20 || code === 0x7f) {
      continue;
    }
    result += char;
  }
  return result;
}

export function visibleWidth(text: string): number {
  return stringWidth(text);
}

export function truncateToVisibleWidth(text: string, maxWidth: number): string {
  if (maxWidth <= 0) {
    return '';
  }
  if (visibleWidth(text) <= maxWidth) {
    return text;
  }
  let result = '';
  for (const char of text) {
    const next = result + char;
    if (visibleWidth(next) > maxWidth) {
      break;
    }
    result = next;
  }
  return result;
}

export function padEnd(text: string, width: number): string {
  const w = visibleWidth(text);
  if (w >= width) {
    return truncateToVisibleWidth(text, width);
  }
  return text + ' '.repeat(width - w);
}

export function padStart(text: string, width: number): string {
  const w = visibleWidth(text);
  if (w >= width) {
    return truncateToVisibleWidth(text, width);
  }
  return ' '.repeat(width - w) + text;
}

function wrapSegmentToVisibleLines(segment: string, maxWidth: number): string[] {
  if (maxWidth <= 0) {
    return [''];
  }
  if (segment.length === 0) {
    return [''];
  }
  if (visibleWidth(segment) <= maxWidth) {
    return [segment];
  }

  const lines: string[] = [];
  let line = '';
  for (const char of segment) {
    const next = line + char;
    if (visibleWidth(next) > maxWidth) {
      if (line.length > 0) {
        lines.push(line);
        line = char;
      } else {
        lines.push(char);
        line = '';
      }
    } else {
      line = next;
    }
  }
  if (line.length > 0) {
    lines.push(line);
  }
  return lines;
}

export function wrapToVisibleLines(text: string, maxWidth: number): string[] {
  return text.split('\n').flatMap((segment) => wrapSegmentToVisibleLines(segment, maxWidth));
}

export function wrapLinesForViewport(
  lines: string[],
  maxWidth: number,
  maxDisplayLines: number,
): string[] {
  if (maxDisplayLines <= 0) {
    return [];
  }
  const wrapped = lines.flatMap((line) => wrapToVisibleLines(line, maxWidth));
  return wrapped.slice(-maxDisplayLines).map((line) => padEnd(line, maxWidth));
}
