import { describe, expect, it } from 'vitest';
import {
  applyQueryEdit,
  applyQueryKeyboardEdit,
  deleteWordBackward,
  queryEditAction,
} from '../../src/search/query-editing.js';

const noMods = {
  ctrl: false,
  meta: false,
  super: false,
  backspace: false,
  delete: false,
};

describe('deleteWordBackward', () => {
  it('removes the last space-separated word', () => {
    expect(deleteWordBackward('forest-cli table')).toBe('forest-cli ');
  });

  it('splits on hyphens and other non-alphanumeric separators', () => {
    expect(deleteWordBackward('some-text')).toBe('some-');
    expect(deleteWordBackward('forest-cli')).toBe('forest-');
    expect(deleteWordBackward('repo__master')).toBe('repo__');
  });

  it('deletes trailing separators before the next segment', () => {
    expect(deleteWordBackward('test_')).toBe('test');
    expect(deleteWordBackward('some-')).toBe('some');
    expect(deleteWordBackward('repo__')).toBe('repo');
  });

  it('deletes trailing whitespace as its own step', () => {
    expect(deleteWordBackward('forest-cli ')).toBe('forest-cli');
  });
});

describe('queryEditAction', () => {
  it('clears the query on Cmd+Backspace', () => {
    expect(queryEditAction('', { ...noMods, super: true, backspace: true })).toBe('line');
  });

  it('clears the query when the terminal sends ^U for Cmd+Backspace', () => {
    expect(queryEditAction('\x15', noMods)).toBe('line');
  });

  it('deletes a word on Option+Backspace', () => {
    expect(queryEditAction('', { ...noMods, meta: true, backspace: true })).toBe('word');
    expect(queryEditAction('\x17', noMods)).toBe('word');
    expect(queryEditAction('[27;3~', noMods)).toBe('word');
  });

  it('deletes one character on plain Backspace', () => {
    expect(queryEditAction('', { ...noMods, backspace: true })).toBe('char');
  });
});

describe('applyQueryKeyboardEdit', () => {
  it('deletes a word on Option+Backspace', () => {
    expect(
      applyQueryKeyboardEdit('forest-cli table', '', {
        ...noMods,
        meta: true,
        backspace: true,
      }).query,
    ).toBe('forest-cli ');
  });

  it('clears on Cmd+Backspace', () => {
    expect(
      applyQueryKeyboardEdit('forest-cli', '', { ...noMods, super: true, backspace: true }).query,
    ).toBe('');
  });

  it('deletes one character on Backspace', () => {
    expect(applyQueryEdit('ab', 'char')).toBe('a');
  });
});
