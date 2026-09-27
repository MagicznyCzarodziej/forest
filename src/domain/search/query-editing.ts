export interface QueryEditKey {
  ctrl: boolean;
  meta: boolean;
  super: boolean;
  backspace: boolean;
  delete: boolean;
}

/** xterm-style Option+Backspace sequences Ink leaves in `input` (common in iTerm2). */
const CSI_OPTION_BACKSPACE = /^\[(?:27|127)(?:;\d+)?~$/;

function isQueryWhitespace(char: string): boolean {
  return /\s/.test(char);
}

function isQuerySeparator(char: string): boolean {
  return /[-_./]/.test(char);
}

function isQueryAlnum(char: string): boolean {
  return /[A-Za-z0-9]/.test(char);
}

/** Option+Backspace: whitespace, then separators, then alnum — like VS Code / IntelliJ. */
export function deleteWordBackward(query: string): string {
  let end = query.length;
  if (end === 0) {
    return query;
  }

  const last = query[end - 1];

  if (isQueryWhitespace(last)) {
    while (end > 0 && isQueryWhitespace(query[end - 1])) {
      end -= 1;
    }
    return query.slice(0, end);
  }

  if (isQuerySeparator(last)) {
    while (end > 0 && isQuerySeparator(query[end - 1])) {
      end -= 1;
    }
    return query.slice(0, end);
  }

  if (isQueryAlnum(last)) {
    while (end > 0 && isQueryAlnum(query[end - 1])) {
      end -= 1;
    }
    return query.slice(0, end);
  }

  return query.slice(0, end - 1);
}

export type QueryEditAction = 'line' | 'word' | 'char';

export function queryEditAction(input: string, key: QueryEditKey): QueryEditAction | null {
  if (key.super && (key.backspace || key.delete)) {
    return 'line';
  }

  if (key.meta && (key.backspace || key.delete)) {
    return 'word';
  }
  if (CSI_OPTION_BACKSPACE.test(input)) {
    return 'word';
  }
  if (input === '\x17') {
    return 'word';
  }
  if (key.meta && input.toLowerCase() === 'w') {
    return 'word';
  }

  // iTerm2 often maps ⌘+Backspace to readline kill-line (^U).
  if (input === '\x15') {
    return 'line';
  }

  if (key.backspace || key.delete) {
    return 'char';
  }

  return null;
}

export function applyQueryEdit(query: string, action: QueryEditAction): string {
  switch (action) {
    case 'line':
      return '';
    case 'word':
      return deleteWordBackward(query);
    case 'char':
      return query.slice(0, -1);
  }
}

export function applyQueryKeyboardEdit(
  query: string,
  input: string,
  key: QueryEditKey,
): { query: string; handled: boolean } {
  const action = queryEditAction(input, key);
  if (!action) {
    return { query, handled: false };
  }
  return { query: applyQueryEdit(query, action), handled: true };
}
