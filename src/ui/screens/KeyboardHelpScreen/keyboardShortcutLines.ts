export interface KeyboardShortcutLine {
  keys: string;
  description: string;
}

export const keyboardShortcutLines: KeyboardShortcutLine[] = [
  { keys: '↑ ↓ Home End', description: 'Move selection in the list' },
  { keys: 'Type', description: 'Filter the list' },
  { keys: 'Tab', description: 'Complete filter text from matches' },
  { keys: 'Enter', description: 'Open or confirm the selected item' },
  { keys: 'Esc', description: 'Clear filter, go back, or cancel' },
  { keys: '←', description: 'Go back (same as Esc when filter is empty)' },
  { keys: 'Alt+Enter', description: 'Toggle strict name match (repositories)' },
  { keys: '?', description: 'Open this help screen (empty filter)' },
  { keys: 'Ctrl+C', description: 'Quit forest' },
];
