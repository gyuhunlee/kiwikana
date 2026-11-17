import type { Deck } from '../../shared/content/types';
import type { DayKey } from '../../shared/time/dayKey.logic';

export const PACK_SIZE = 10;
export const WEAK_R = 0.7;
export const RETENTION = 0.85;
export const REINSERT_OFFSET = 3;
export const RETURN_GAP = 2;

/** An FSRS card as saved. Only `fsrs.logic.ts` knows what is inside `data`. */
export interface FsrsCard {
  due: string;
  lastReview: string | null;
  data: Record<string, unknown>;
}

// WF-1, WF-2: everything the feed needs from FSRS. The real one is in fsrs.logic.ts.
export interface Scheduler {
  /** null when the card has no review yet. */
  retrievability(card: FsrsCard, now: Date): number | null;
  /** Know = Good, Don't know = Again. `card` is null for a word's first rating. */
  rate(card: FsrsCard | null, know: boolean, now: Date): FsrsCard;
  /** A card with no review, due at `due` (WF-42). */
  fresh(due: Date): FsrsCard;
}

export type WordStatus = 'new' | 'learning' | 'known';

export interface WordState {
  wordId: string;
  status: WordStatus;
  fsrs: FsrsCard | null;
  dots: number;
  lastDotDay: DayKey | null;
  lastRatedDay: DayKey | null;
  metAt: string | null;
  metOnHome: boolean;
  /** The sentence the word's next card will use (WF-18). */
  sentenceIndex: 0 | 1;
  strokeDays: number;
  lastStrokeDay: DayKey | null;
  strokeRemoved: boolean;
  strokeRetired: boolean;
}

export type CardType = 'new' | 'returning' | 'strong' | 'weak';

export interface Card {
  wordId: string;
  type: CardType;
  sentenceIndex: 0 | 1;
  loop?: true;
}

export interface Pack {
  dayKey: DayKey;
  seq: number;
  cards: Card[];
  position: number;
  history: Card[];
}

export type Words = Readonly<Record<string, WordState>>;

export interface FeedContent {
  /** Every deck, any order. */
  decks: readonly Deck[];
  /** CT-13: decks with every file on disk. New words come only from these. */
  readyDeckIds: readonly string[];
}

export function newWordState(wordId: string): WordState {
  return {
    wordId,
    status: 'new',
    fsrs: null,
    dots: 0,
    lastDotDay: null,
    lastRatedDay: null,
    metAt: null,
    metOnHome: false,
    sentenceIndex: 0,
    strokeDays: 0,
    lastStrokeDay: null,
    strokeRemoved: false,
    strokeRetired: false,
  };
}

/** A word with no saved row is new. */
export function wordOf(words: Words, wordId: string): WordState {
  return words[wordId] ?? newWordState(wordId);
}
