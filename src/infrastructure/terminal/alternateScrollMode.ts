/** Wheel → ↑/↓ cursor keys while the alternate screen is active (xterm 1007). */
const ENABLE_ALTERNATE_SCROLL = '\x1b[?1007h';
const DISABLE_ALTERNATE_SCROLL = '\x1b[?1007l';

export type AlternateScrollStream = {
  isTTY?: boolean;
  write: (chunk: string) => boolean;
};

export function enableAlternateScrollMode(stream: AlternateScrollStream = process.stdout): void {
  if (!stream.isTTY) {
    return;
  }
  stream.write(ENABLE_ALTERNATE_SCROLL);
}

export function disableAlternateScrollMode(stream: AlternateScrollStream = process.stdout): void {
  if (!stream.isTTY) {
    return;
  }
  stream.write(DISABLE_ALTERNATE_SCROLL);
}
