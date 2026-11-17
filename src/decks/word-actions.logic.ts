import { MS_PER_DAY, dayKey } from '../shared/time/dayKey.logic';
import { shiftInstant } from '../shared/time/zone.logic';
import type { Ctx, Effect, HomeState, Result } from '../home/home.types';
import { enqueueRewards } from '../home/rewards/queue.logic';
import { completeDeckIfDone, deckById } from '../home/words/deck-advance.logic';
import { dropUnansweredCards } from '../home/words/answer.logic';
import { ensurePack } from '../home/words/pack.logic';
import { wordOf, type Card, type WordState } from '../home/words/words.types';

// None of these tick the bar or appear on a summary (DB-11).

// DK-40, WF-41: swipe left or "I already know this".
export function markKnown(state: HomeState, wordId: string, ctx: Ctx): Result {
  const word = wordOf(state.words, wordId);
  if (word.status === 'known') return { state, effects: [] };

  const wasNew = word.status === 'new';
  const known: WordState = {
    ...word,
    status: 'known',
    dots: 3,
    fsrs: null,
    metAt: wasNew ? ctx.clock.now().toISOString() : word.metAt,
  };
  let next: HomeState = { ...state, words: { ...state.words, [wordId]: known } };
  const effects: Effect[] = [{ type: 'reloadWidgets' }, { type: 'showUndo' }];

  // WF-41: its unanswered cards leave today's pack. No refill.
  if (next.pack) next = { ...next, pack: dropUnansweredCards(next.pack, wordId, next.pack.position) };

  if (wasNew) {
    // RW-6: the card waits in the queue and shows the next time Home is open.
    const checked = completeDeckIfDone(next, wordId, ctx.content);
    next = checked.state;
    if (checked.card) {
      next = { ...next, rewardQueue: enqueueRewards(next.rewardQueue, [checked.card]) };
      effects.push({ type: 'queueReward', card: checked.card });
    }
  }
  // If that emptied the rest of the pack, carry on with the next one (WF-36).
  if (next.pack) next = ensurePack(next, dayKey(ctx.clock), ctx);
  return { state: next, effects };
}

// DK-41, WF-42: swipe right or "Mark as learning". Not added to today's pack.
export function markLearning(state: HomeState, wordId: string, ctx: Ctx): Result {
  const word = wordOf(state.words, wordId);
  if (word.status !== 'known') return { state, effects: [] };

  const tomorrow = shiftInstant(ctx.clock.now(), MS_PER_DAY);
  const learning: WordState = {
    ...word,
    status: 'learning',
    dots: 0,
    lastDotDay: null,
    lastRatedDay: null,
    fsrs: ctx.scheduler.fresh(tomorrow),
  };
  return {
    state: { ...state, words: { ...state.words, [wordId]: learning } },
    effects: [{ type: 'reloadWidgets' }, { type: 'showUndo' }],
  };
}

const other = (index: 0 | 1): 0 | 1 => (index === 0 ? 1 : 0);

// DK-27, WF-40 (default OQ-1): this deck becomes current. Unanswered new cards and their returning
// cards are swapped for the new deck's next unseen words in the same positions. The bar is unchanged.
export function studyDeck(state: HomeState, deckId: string, ctx: Ctx): Result {
  const deck = deckById(ctx.content.decks, deckId);
  if (!deck) return { state, effects: [] };

  const switched: HomeState = { ...state, deck: { ...state.deck, level: deck.level, currentDeckId: deck.id } };
  const today = dayKey(ctx.clock);
  const pack = switched.pack;
  if (!pack || pack.dayKey !== today) return { state: ensurePack(switched, today, ctx), effects: [{ type: 'reloadWidgets' }] };

  const outgoing = pack.cards.filter((card, index) => index >= pack.position && card.type === 'new').map((card) => card.wordId);
  const stillInPack = new Set(pack.cards.filter((card) => !outgoing.includes(card.wordId)).map((card) => card.wordId));
  const incoming = deck.wordIds.filter(
    (wordId) => wordOf(switched.words, wordId).status === 'new' && !stillInPack.has(wordId),
  );
  const replacement = new Map(outgoing.map((wordId, index) => [wordId, incoming[index]] as const));

  const cards = pack.cards.flatMap((card, index): Card[] => {
    if (index < pack.position || !replacement.has(card.wordId)) return [card];
    const wordId = replacement.get(card.wordId);
    if (wordId === undefined) return []; // the new deck has fewer unseen words than the pack had
    const start = wordOf(switched.words, wordId).sentenceIndex;
    return [{ wordId, type: card.type, sentenceIndex: card.type === 'new' ? start : other(start) }];
  });

  return { state: { ...switched, pack: { ...pack, cards } }, effects: [{ type: 'reloadWidgets' }] };
}
