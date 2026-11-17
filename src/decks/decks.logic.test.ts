import { describe, expect, it } from 'vitest';
import type { Word } from '../shared/content/types';
import { fixtureDecks } from '../shared/testing/fixtures';
import { scenario } from '../shared/testing/scenarios';
import { deckRows, matchesPill, partLabel, peekRows, sheetButtons, swipeAction, themeCards } from './deck-progress.logic';
import { normalizeRomaji, searchWords } from './search.logic';

const word = (id: string, kanji: string, kana: string, romaji: string, meaning: string, level: Word['level'] = 'N5', order = 0): Word => ({
  id, kanji, kana, romaji, meaning, level, deckId: 'd', order, pictureAnime: '', pictureRealistic: '', audio: '', sentenceIds: ['', ''],
});
const dictionary = [
  word('neko', '猫', 'ねこ', 'neko', 'cat'),
  word('tokyo', '東京', 'とうきょう', 'toukyou', 'Tokyo'),
  word('category', '種類', 'しゅるい', 'shurui', 'category', 'N4'),
  word('cats-n3', '猫背', 'ねこぜ', 'nekoze', 'stoop', 'N3'),
  word('cat-n4', '山猫', 'やまねこ', 'yamaneko', 'wildcat', 'N4'),
];
const ids = (query: string) => searchWords(dictionary, query).map((w) => w.id);

describe('search', () => {
  it('DK-10 matches on word, kana, romaji and meaning, any case', () => {
    for (const query of ['neko', 'ねこ', '猫', 'cat', 'CAT', 'Neko']) expect(ids(query)[0]).toBe('neko');
  });

  it('DK-10 romaji matches with or without spaces and long-vowel marks', () => {
    for (const query of ['toukyou', 'tokyo', 'tōkyō', 'to kyo', 'Tōkyō']) expect(ids(query)).toEqual(['tokyo']);
    expect(normalizeRomaji('Tōkyō')).toBe(normalizeRomaji('tou kyou'));
  });

  it('DK-11 exact, then prefix, then contains; ties by level, N5 first', () => {
    expect(ids('cat')).toEqual(['neko', 'category', 'cat-n4']);
    expect(ids('neko')).toEqual(['neko', 'cats-n3', 'cat-n4']);
    expect(ids('猫')).toEqual(['neko', 'cats-n3', 'cat-n4']);
  });

  it('DK-13 nothing found gives an empty list; an empty query too', () => {
    expect(ids('zzz')).toEqual([]);
    expect(ids('  ')).toEqual([]);
  });
});

describe('deck progress', () => {
  const decks = fixtureDecks();
  const [core1, core2] = decks;
  if (!core1 || !core2) throw new Error('fixture decks missing');

  it('DK-21 part label is Known / size, or Mastered', () => {
    const s = scenario.decksMixed().withKnown(core2.wordIds).build();
    expect([partLabel(core1, s.words), partLabel(core2, s.words)]).toEqual(['4 / 20', 'Mastered']);
  });

  it('DK-3 DK-5 theme cards for the chosen level: a bar per part and a badge', () => {
    const s = scenario.decksMixed().withKnown(decks.slice(3).flatMap((deck) => deck.wordIds)).build();
    const cards = themeCards(decks, 'N5', s.words, 'core1');
    expect(cards.map((card) => [card.theme, card.badge])).toEqual([['Core', 'Studying 1'], ['Food', 'Mastered']]);
    expect(cards[0]?.parts.map((part) => part.known)).toEqual([4, 0, 0]);
    expect(themeCards(decks, 'N5', s.words, null)[0]?.badge).toBeNull();
    expect(themeCards(decks, 'N4', s.words, 'core1')).toEqual([]);
  });

  it('DK-22 pills: All, Learning = new or learning, Known', () => {
    expect([matchesPill('new', 'learning'), matchesPill('learning', 'learning'), matchesPill('known', 'learning')]).toEqual([true, true, false]);
    expect([matchesPill('new', 'known'), matchesPill('known', 'known'), matchesPill('known', 'all')]).toEqual([false, true, true]);
    const s = scenario.decksMixed().build();
    expect(deckRows(core1, s.words, 'known', 'recentlyAdded', (id) => id)).toEqual(['core1-07', 'core1-08', 'core1-09', 'core1-10']);
    expect(deckRows(core1, s.words, 'learning', 'recentlyAdded', (id) => id)).toHaveLength(16);
  });

  it('DK-23 sort A–Z by romaji', () => {
    const s = scenario.decksMixed().build();
    const backwards = (id: string) => String(99 - Number(id.slice(-2)));
    expect(deckRows(core1, s.words, 'known', 'romaji', backwards)).toEqual(['core1-10', 'core1-09', 'core1-08', 'core1-07']);
  });

  it('DK-25 swipe left on a not-Known row → Known; right on a Known row → Learning; nothing else', () => {
    expect([swipeAction('new', 'left'), swipeAction('learning', 'left'), swipeAction('known', 'right')]).toEqual(['toKnown', 'toKnown', 'toLearning']);
    expect([swipeAction('known', 'left'), swipeAction('learning', 'right')]).toEqual([null, null]);
  });

  it('DK-26 peek only the first time a deck page opens', () => {
    const s = scenario.decksMixed().build();
    expect(peekRows('core1', [], core1.wordIds, s.words)).toEqual({ left: 'core1-01', right: 'core1-07' });
    expect(peekRows('core1', ['core1'], core1.wordIds, s.words)).toBeNull();
    expect(peekRows('core2', [], core2.wordIds, s.words)).toEqual({ left: 'core2-01', right: null });
  });

  it('DK-31 sheet buttons by state', () => {
    expect(sheetButtons('learning')).toEqual(['I already know this', 'Practice writing']);
    expect(sheetButtons('known')).toEqual(['Mark as learning', 'Practice writing']);
  });
});
