import { dayKey, type DayKey } from '../../shared/time/dayKey.logic';
import { tick } from '../bar/day.logic';
import type { LogEntry } from '../bar/day.types';
import type { Ctx, Effect, HomeState, Result } from '../home.types';
import { enqueueRewards, summaryPending } from '../rewards/queue.logic';
import { completeDeckIfDone } from './deck-advance.logic';
import { currentCard, ensurePack } from './pack.logic';
import { REINSERT_OFFSET, wordOf, type Card, type Pack, type WordState } from './words.types';

const other = (index: 0 | 1): 0 | 1 => (index === 0 ? 1 : 0);

function setWord(state: HomeState, word: WordState): HomeState {
  return { ...state, words: { ...state.words, [word.wordId]: word } };
}

/** Moves past the card on screen and keeps it for look-back (WF-37). */
function advance(pack: Pack): Pack {
  const answered = pack.cards[pack.position];
  return { ...pack, position: pack.position + 1, history: answered ? [...pack.history, answered] : pack.history };
}

/** Removes the word's cards that have not been answered yet. `from` is the first index to consider. */
export function dropUnansweredCards(pack: Pack, wordId: string, from: number): Pack {
  return { ...pack, cards: pack.cards.filter((card, index) => index < from || card.wordId !== wordId) };
}

// Every answer ends the same way: tick (DB-10), deck check (WF-50), then the next pack if this one is done (WF-36).
function finish(state: HomeState, today: DayKey, entry: LogEntry, metNewWord: boolean, effects: Effect[], ctx: Ctx): Result {
  const ticked = tick(state, today, entry);
  let next: HomeState = ticked.state;
  const all: Effect[] = [...effects, ...ticked.effects];

  if (metNewWord) {
    const checked = completeDeckIfDone(next, entry.id, ctx.content);
    next = checked.state;
    if (checked.card) {
      // RW-2: the summary from this same answer stays ahead of the deck card.
      next = { ...next, rewardQueue: enqueueRewards(next.rewardQueue, [checked.card]) };
      all.push({ type: 'queueReward', card: checked.card });
    }
  }
  return { state: ensurePack(next, today, ctx), effects: all };
}

function cardOnScreen(state: HomeState): Card | null {
  // DB-17: while a summary waits, the feed shows it and nothing can be answered.
  if (summaryPending(state.rewardQueue)) return null;
  return currentCard(state.pack);
}

export function answerNewCard(state: HomeState, choice: 'learn' | 'iKnowIt', ctx: Ctx): Result {
  const today = dayKey(ctx.clock);
  const card = cardOnScreen(state);
  if (!card || !state.pack || card.type !== 'new') return { state, effects: [] };

  const metAt = ctx.clock.now().toISOString();
  const word = wordOf(state.words, card.wordId);
  let pack = advance(state.pack);

  if (choice === 'learn') {
    // WF-30: no FSRS rating and no dot. The returning card stays.
    const learned: WordState = { ...word, status: 'learning', metAt, metOnHome: true };
    const next = { ...setWord(state, learned), pack };
    return finish(next, today, { kind: 'wordLearn', id: card.wordId }, true, [{ type: 'refreshStrokePool' }], ctx);
  }

  // WF-31: never scheduled in FSRS; its returning card leaves the pack.
  const known: WordState = { ...word, status: 'known', dots: 3, fsrs: null, metAt, metOnHome: true };
  pack = dropUnansweredCards(pack, card.wordId, pack.position);
  const next = { ...setWord(state, known), pack };
  const effects: Effect[] = [{ type: 'showUndo' }, { type: 'reloadWidgets' }, { type: 'refreshStrokePool' }];
  return finish(next, today, { kind: 'wordKnewIt', id: card.wordId }, true, effects, ctx);
}

export function answerQuiz(state: HomeState, know: boolean, ctx: Ctx): Result {
  // DB-19: after a rollover the answer applies to the new day; finish() then drops the old pack (WF-44).
  const today = dayKey(ctx.clock);
  const card = cardOnScreen(state);
  if (!card || !state.pack || card.type === 'new') return { state, effects: [] };

  const effects: Effect[] = [];
  let word = wordOf(state.words, card.wordId);
  let pack = state.pack;

  // WF-32: only the first quiz answer for a word in a day rates it.
  if (word.lastRatedDay !== today) {
    word = { ...word, fsrs: ctx.scheduler.rate(word.fsrs, know, ctx.clock.now()), lastRatedDay: today };
  }

  if (know) {
    // WF-33: a dot only for a word met on an earlier day, once a day.
    const earnsDot = (card.type === 'strong' || card.type === 'weak') && !card.loop && word.lastDotDay !== today;
    if (earnsDot) word = { ...word, dots: word.dots + 1, lastDotDay: today };
    if (word.dots >= 3) {
      word = { ...word, status: 'known', fsrs: null };
      effects.push({ type: 'reloadWidgets' });
    }
    pack = advance(pack);
    if (word.status === 'known') pack = dropUnansweredCards(pack, card.wordId, pack.position);
  } else {
    // WF-34 (defaults NQ-3, NQ-4): same word again 3 cards later with the other sentence. Dots never go down.
    const loop: Card = { wordId: card.wordId, type: 'returning', sentenceIndex: other(card.sentenceIndex), loop: true };
    const cards = [...pack.cards];
    cards.splice(Math.min(pack.position + REINSERT_OFFSET, cards.length), 0, loop);
    word = { ...word, sentenceIndex: card.sentenceIndex }; // WF-18: the appearance after the loop flips back.
    pack = advance({ ...pack, cards });
  }

  const next = { ...setWord(state, word), pack };
  return finish(next, today, { kind: 'wordQuiz', id: card.wordId, correct: know }, false, effects, ctx); // WF-35
}
