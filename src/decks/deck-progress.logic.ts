import { isDeckMastered } from '../home/words/deck-advance.logic';
import { wordOf, type WordStatus, type Words } from '../home/words/words.types';
import type { Deck, Level } from '../shared/content/types';

export function knownCount(deck: Deck, words: Words): number {
  return deck.wordIds.filter((wordId) => wordOf(words, wordId).status === 'known').length;
}

// DK-21
export function partLabel(deck: Deck, words: Words): string {
  return isDeckMastered(deck, words) ? 'Mastered' : `${knownCount(deck, words)} / ${deck.wordIds.length}`;
}

export interface ThemeCard {
  theme: string;
  parts: { deckId: string; part: number; known: number; size: number }[];
  badge: string | null;
}

// DK-3 (default NQ-12): the chip only filters this list. DK-5: bars and badge.
export function themeCards(decks: readonly Deck[], level: Level, words: Words, currentDeckId: string | null): ThemeCard[] {
  const inLevel = decks.filter((deck) => deck.level === level).sort((a, b) => a.order - b.order);
  return [...new Set(inLevel.map((deck) => deck.theme))].map((theme) => {
    const parts = inLevel.filter((deck) => deck.theme === theme);
    const studying = parts.find((deck) => deck.id === currentDeckId);
    const mastered = parts.every((deck) => isDeckMastered(deck, words));
    return {
      theme,
      parts: parts.map((deck) => ({ deckId: deck.id, part: deck.part, known: knownCount(deck, words), size: deck.wordIds.length })),
      badge: studying ? `Studying ${studying.part}` : mastered ? 'Mastered' : null,
    };
  });
}

export type Pill = 'all' | 'learning' | 'known';
export type Sort = 'recentlyAdded' | 'romaji';

// DK-22: Learning = new or learning.
export function matchesPill(status: WordStatus, pill: Pill): boolean {
  if (pill === 'all') return true;
  return pill === 'known' ? status === 'known' : status !== 'known';
}

// DK-22, DK-23
export function deckRows(
  deck: Deck,
  words: Words,
  pill: Pill,
  sort: Sort,
  romajiOf: (wordId: string) => string,
): string[] {
  const rows = deck.wordIds.filter((wordId) => matchesPill(wordOf(words, wordId).status, pill));
  return sort === 'romaji' ? [...rows].sort((a, b) => romajiOf(a).localeCompare(romajiOf(b))) : rows;
}

// DK-25
export function swipeAction(status: WordStatus, direction: 'left' | 'right'): 'toKnown' | 'toLearning' | null {
  if (direction === 'left' && status !== 'known') return 'toKnown';
  if (direction === 'right' && status === 'known') return 'toLearning';
  return null;
}

// DK-26: first open of a deck page only. null = never again for this deck.
export function peekRows(
  deckId: string,
  peekedDeckIds: readonly string[],
  rows: readonly string[],
  words: Words,
): { left: string | null; right: string | null } | null {
  if (peekedDeckIds.includes(deckId)) return null;
  return {
    left: rows.find((wordId) => wordOf(words, wordId).status !== 'known') ?? null,
    right: rows.find((wordId) => wordOf(words, wordId).status === 'known') ?? null,
  };
}

// DK-31
export function sheetButtons(status: WordStatus): string[] {
  return [status === 'known' ? 'Mark as learning' : 'I already know this', 'Practice writing'];
}
