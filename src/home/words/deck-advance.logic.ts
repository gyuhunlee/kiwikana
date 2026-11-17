import type { Deck } from '../../shared/content/types';
import type { HomeState } from '../home.types';
import type { DeckCompleteCard } from '../rewards/reward.types';
import { wordOf, type FeedContent, type Words } from './words.types';

// DK-2b
export function deckName(deck: Deck): string {
  return `${deck.level} ${deck.theme} ${deck.part}`;
}

export function deckById(decks: readonly Deck[], deckId: string | null): Deck | null {
  return decks.find((deck) => deck.id === deckId) ?? null;
}

export function deckOfWord(decks: readonly Deck[], wordId: string): Deck | null {
  return decks.find((deck) => deck.wordIds.includes(wordId)) ?? null;
}

function levelDecks(decks: readonly Deck[], level: Deck['level']): Deck[] {
  return decks.filter((deck) => deck.level === level).sort((a, b) => a.order - b.order);
}

// WF-50: next part of the same theme, else the first part of the next theme at the same level.
export function nextDeck(decks: readonly Deck[], current: Deck): Deck | null {
  const sameLevel = levelDecks(decks, current.level);
  const nextPart = sameLevel.find((deck) => deck.theme === current.theme && deck.part === current.part + 1);
  if (nextPart) return nextPart;

  const themes = [...new Set(sameLevel.map((deck) => deck.theme))];
  const nextTheme = themes[themes.indexOf(current.theme) + 1];
  if (nextTheme === undefined) return null; // WF-51
  return sameLevel.filter((deck) => deck.theme === nextTheme).sort((a, b) => a.part - b.part)[0] ?? null;
}

/** The deck new words start from: the current deck, or the level's first deck before one is chosen. */
export function startDeck(state: Pick<HomeState, 'deck'>, decks: readonly Deck[]): Deck | null {
  return deckById(decks, state.deck.currentDeckId) ?? levelDecks(decks, state.deck.level)[0] ?? null;
}

// WF-16: next unseen words in deck order, running on into the following decks.
export function unseenWordIds(state: Pick<HomeState, 'deck' | 'words'>, content: FeedContent): string[] {
  const unseen: string[] = [];
  let deck = startDeck(state, content.decks);
  while (deck) {
    if (!content.readyDeckIds.includes(deck.id)) break; // CT-13: new words pause until the deck is on disk.
    unseen.push(...deck.wordIds.filter((wordId) => wordOf(state.words, wordId).status === 'new'));
    deck = nextDeck(content.decks, deck);
  }
  return unseen;
}

// DK-1
export function isDeckComplete(deck: Deck, words: Words): boolean {
  return deck.wordIds.every((wordId) => wordOf(words, wordId).status !== 'new');
}

export function isDeckMastered(deck: Deck, words: Words): boolean {
  return deck.wordIds.every((wordId) => wordOf(words, wordId).status === 'known');
}

// WF-50, WF-51. Run after a new word is met. Returns the card to queue, if the word finished its deck.
export function completeDeckIfDone(
  state: HomeState,
  wordId: string,
  content: FeedContent,
): { state: HomeState; card: DeckCompleteCard | null } {
  const deck = deckOfWord(content.decks, wordId);
  if (!deck || state.deck.completedDeckIds.includes(deck.id) || !isDeckComplete(deck, state.words)) {
    return { state, card: null };
  }
  const next = nextDeck(content.decks, deck);
  const wasCurrent = startDeck(state, content.decks)?.id === deck.id;
  const card: DeckCompleteCard = {
    type: 'deckComplete',
    deckId: deck.id,
    deckName: deckName(deck),
    wordCount: deck.wordIds.length,
    nextDeckId: next?.id ?? null,
    nextDeckName: next ? deckName(next) : null,
  };
  return {
    state: {
      ...state,
      deck: {
        ...state.deck,
        currentDeckId: wasCurrent && next ? next.id : (state.deck.currentDeckId ?? deck.id),
        completedDeckIds: [...state.deck.completedDeckIds, deck.id],
      },
    },
    card,
  };
}
