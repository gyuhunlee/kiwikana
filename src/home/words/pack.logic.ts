import { dayKeyOf, type DayKey } from '../../shared/time/dayKey.logic';
import { instantFromIso } from '../../shared/time/zone.logic';
import type { Ctx, HomeState } from '../home.types';
import { unseenWordIds } from './deck-advance.logic';
import { PACK_SIZE, WEAK_R, wordOf, type Card, type Pack, type WordState, type Words } from './words.types';

interface Review {
  word: WordState;
  /** null: no FSRS review yet. */
  r: number | null;
  dueDay: DayKey;
  dueMs: number;
}

function reviewOf(word: WordState, today: DayKey, ctx: Ctx): Review {
  if (!word.fsrs) {
    // Learned but never quizzed (its pack was dropped at the rollover). Due now, so it is not lost.
    return { word, r: null, dueDay: today, dueMs: 0 };
  }
  const due = instantFromIso(word.fsrs.due);
  return {
    word,
    r: ctx.scheduler.retrievability(word.fsrs, ctx.clock.now()),
    dueDay: dayKeyOf(due, ctx.clock.timeZone()), // WF-3
    dueMs: due.getTime(),
  };
}

const byId = (a: Review, b: Review) => (a.word.wordId < b.word.wordId ? -1 : 1);

// WF-5, WF-11. Known words are never here (WF-6).
export function classify(words: Words, today: DayKey, ctx: Ctx): { weak: WordState[]; strong: WordState[] } {
  const reviews = Object.values(words)
    .filter((word) => word.status === 'learning')
    .map((word) => reviewOf(word, today, ctx));
  const weak = reviews
    .filter((review) => review.r !== null && review.r < WEAK_R)
    .sort((a, b) => (a.r ?? 0) - (b.r ?? 0) || byId(a, b));
  // WF-13: a fresh card (no retrievability) counts as strong once its due day arrives.
  const strong = reviews
    .filter((review) => (review.r === null || review.r >= WEAK_R) && review.dueDay <= today)
    .sort((a, b) => a.dueMs - b.dueMs || byId(a, b));
  return { weak: weak.map((review) => review.word), strong: strong.map((review) => review.word) };
}

export interface PackParts {
  /** Each new card with its returning quiz. */
  pairs: { fresh: Card; returning: Card }[];
  weak: Card[];
  strong: Card[];
}

const isWeak = (card: Card | undefined): boolean => card?.type === 'weak';

/** First gap, not at the very start, where a weak card would have no weak neighbor. -1 when there is none. */
function quietGap(base: readonly Card[]): number {
  for (let index = 1; index < base.length; index += 1) {
    if (!isWeak(base[index - 1]) && !isWeak(base[index])) return index;
  }
  return -1;
}

function addWeak(base: Card[], card: Card): void {
  if (!isWeak(base[base.length - 1]) || base.length === 0) {
    base.push(card);
    return;
  }
  const gap = quietGap(base);
  if (gap === -1) base.push(card);
  else base.splice(gap, 0, card);
}

// Applied once when the pack is built. No randomness.
export function orderCards(parts: PackParts): Card[] {
  const fresh = parts.pairs.map((pair) => pair.fresh);
  const weak = [...parts.weak];
  const strong = [...parts.strong];
  const base: Card[] = [];

  const opener = strong.shift(); // WF-20
  if (opener) base.push(opener);
  const closer = strong.pop(); // WF-24
  base.push(...fresh.splice(0, 2)); // WF-21

  // WF-25: weak, new, strong in turn, so types are interleaved and weak cards are kept apart (WF-23).
  while (weak.length + fresh.length + strong.length > 0) {
    const nextWeak = weak.shift();
    if (nextWeak) addWeak(base, nextWeak);
    const nextFresh = fresh.shift();
    if (nextFresh) base.push(nextFresh);
    const nextStrong = strong.shift();
    if (nextStrong) base.push(nextStrong);
  }
  if (closer) base.push(closer);

  // WF-22: a returning quiz comes after two more cards have passed; at the end when the pack runs out.
  const ordered: Card[] = [];
  const waiting = parts.pairs.map((pair) => ({ ...pair, after: base.indexOf(pair.fresh) + 2 }));
  base.forEach((card, index) => {
    ordered.push(card);
    const due = waiting.find((pair) => pair.after === index);
    if (due) ordered.push(due.returning);
  });
  ordered.push(...waiting.filter((pair) => pair.after >= base.length).map((pair) => pair.returning));
  return ordered;
}

const other = (index: 0 | 1): 0 | 1 => (index === 0 ? 1 : 0);

export function packIsFor(pack: Pack | null, today: DayKey, seq: number): pack is Pack {
  return pack !== null && pack.dayKey === today && pack.seq === seq;
}

export function buildPack(state: HomeState, today: DayKey, seq: number, ctx: Ctx): HomeState {
  if (packIsFor(state.pack, today, seq)) return state; // WF-10

  const { weak, strong } = classify(state.words, today, ctx);
  // WF-12 (default NQ-1)
  const manyWeak = weak.length > 6;
  const maxHard = manyWeak ? 3 : 2;
  const wantedNew = manyWeak ? 2 : state.newWordsPerDay;

  const unseen = unseenWordIds(state, ctx.content);
  const freshIds = unseen.splice(0, wantedNew);
  const hard = weak.slice(0, maxHard);
  // WF-14
  let room = PACK_SIZE - freshIds.length * 2 - hard.length;
  const reviews = strong.slice(0, Math.max(room, 0));
  room -= reviews.length;
  // WF-15: fill with more new words while a pair still fits. One leftover slot stays empty.
  while (room >= 2 && unseen.length > 0) {
    freshIds.push(...unseen.splice(0, 1));
    room -= 2;
  }

  // WF-18: each appearance takes the word's next sentence and flips it.
  const words: Record<string, WordState> = { ...state.words };
  const take = (wordId: string): 0 | 1 => {
    const word = wordOf(words, wordId);
    words[wordId] = { ...word, sentenceIndex: other(word.sentenceIndex) };
    return word.sentenceIndex;
  };
  const parts: PackParts = {
    pairs: freshIds.map((wordId) => ({
      fresh: { wordId, type: 'new', sentenceIndex: take(wordId) },
      returning: { wordId, type: 'returning', sentenceIndex: take(wordId) },
    })),
    weak: hard.map((word) => ({ wordId: word.wordId, type: 'weak', sentenceIndex: take(word.wordId) })),
    strong: reviews.map((word) => ({ wordId: word.wordId, type: 'strong', sentenceIndex: take(word.wordId) })),
  };

  // WF-17: nothing unseen and nothing due or weak gives an empty pack.
  const pack: Pack = { dayKey: today, seq, cards: orderCards(parts), position: 0, history: [] };
  return { ...state, words, pack };
}

export function currentCard(pack: Pack | null): Card | null {
  return pack?.cards[pack.position] ?? null;
}

export function isPackFinished(pack: Pack): boolean {
  return pack.position >= pack.cards.length;
}

// WF-44: yesterday's unfinished pack is dropped; today's is built at the first open.
// WF-36: a finished pack is followed by the next one with no break.
export function ensurePack(state: HomeState, today: DayKey, ctx: Ctx): HomeState {
  if (!state.pack || state.pack.dayKey !== today) return buildPack({ ...state, pack: null }, today, 1, ctx);
  if (isPackFinished(state.pack) && state.pack.cards.length > 0) return buildPack(state, today, state.pack.seq + 1, ctx);
  return state;
}
