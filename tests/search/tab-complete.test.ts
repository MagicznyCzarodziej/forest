import { describe, expect, it } from 'vitest';
import { tabCompleteAdvance, tabCompleteHint } from '../../src/domain/search/tab-complete';

const repositories = [
  'table-rotating-blah',
  'table-rotating-garden',
  'table-fuzzy-mine',
  'tableau-seven',
  'random-goat',
];

describe('tabCompleteHint', () => {
  it('returns the suffix Tab would add for a shared-prefix extension', () => {
    expect(tabCompleteHint('ta', repositories, null)).toBe('ble');
    expect(tabCompleteHint('table-r', repositories, null)).toBe('otating-');
  });

  it('returns the rest of a single matching name', () => {
    expect(tabCompleteHint('ran', repositories, null)).toBe('dom-goat');
  });

  it('returns empty when there is no completion', () => {
    expect(tabCompleteHint('zzz', repositories, null)).toBe('');
    expect(tabCompleteHint('', repositories, null)).toBe('');
  });

  it('is case-insensitive for the typed query', () => {
    expect(tabCompleteHint('TA', repositories, null)).toBe('ble');
    expect(tabCompleteHint('TABLE-R', repositories, null)).toBe('otating-');
    expect(tabCompleteHint('Ran', repositories, null)).toBe('dom-goat');
  });

  it('follows the active Tab cycle state', () => {
    const first = tabCompleteAdvance('table-r', repositories, null);
    expect(tabCompleteHint(first.query, repositories, first.state)).toBe('blah');
  });
});

describe('tabCompleteAdvance', () => {
  it('extends to the longest prefix shared by every name that starts with the query', () => {
    expect(tabCompleteAdvance('ta', repositories, null).query).toBe('table');
    expect(tabCompleteAdvance('table-r', repositories, null).query).toBe('table-rotating-');
  });

  it('completes a single match to the full name', () => {
    expect(tabCompleteAdvance('tablea', repositories, null).query).toBe('tableau-seven');
    expect(tabCompleteAdvance('ran', repositories, null).query).toBe('random-goat');
  });

  it('leaves the query unchanged when nothing starts with it', () => {
    expect(tabCompleteAdvance('zzz', repositories, null).query).toBe('zzz');
  });

  it('cycles the matching names after the shared prefix', () => {
    const first = tabCompleteAdvance('table-r', repositories, null);
    expect(first.query).toBe('table-rotating-');

    const second = tabCompleteAdvance(first.query, repositories, first.state);
    expect(second.query).toBe('table-rotating-blah');

    const third = tabCompleteAdvance(second.query, repositories, second.state);
    expect(third.query).toBe('table-rotating-garden');

    const fourth = tabCompleteAdvance(third.query, repositories, third.state);
    expect(fourth.query).toBe('table-rotating-blah');
  });

  it('moves to the next name when the query is already the first match', () => {
    const names = ['lumi', 'luminark', 'backend'];
    const first = tabCompleteAdvance('lumi', names, null);
    expect(first.query).toBe('luminark');
  });

  it('skips the first result when the query is already that name', () => {
    const names = ['lumi', 'luminark', 'backend'];
    const first = tabCompleteAdvance('lum', names, null);
    expect(first.query).toBe('lumi');

    const second = tabCompleteAdvance(first.query, names, first.state);
    expect(second.query).toBe('luminark');

    const third = tabCompleteAdvance(second.query, names, second.state);
    expect(third.query).toBe('lumi');
  });

  it('cycles every name that started with the original query', () => {
    const first = tabCompleteAdvance('ta', repositories, null);
    const seen: string[] = [];
    let step = first;
    for (let i = 0; i < 4; i += 1) {
      step = tabCompleteAdvance(step.query, repositories, step.state);
      seen.push(step.query);
    }
    expect(seen).toEqual([
      'table-rotating-blah',
      'table-rotating-garden',
      'table-fuzzy-mine',
      'tableau-seven',
    ]);
  });
});
