import { describe, expect, it } from 'vitest';
import { fakeClock, type FakeClock } from '../../shared/testing/fakeClock';
import { fakeScheduler } from '../../shared/testing/fakeScheduler';
import { fixtureContent } from '../../shared/testing/fixtures';
import { scenario } from '../../shared/testing/scenarios';
import { dayKey } from '../../shared/time/dayKey.logic';
import { barText, dayOf } from '../bar/day.logic';
import type { Ctx, HomeState, Result } from '../home.types';
import { openUndo, takeUndo } from '../undo.logic';
import { answerNewCard, answerQuiz } from './answer.logic';
import { currentCard, ensurePack } from './pack.logic';
import { wordOf, type Card, type Pack } from './words.types';

const content = fixtureContent();
const ctxOf = (clock: FakeClock): Ctx => ({ clock, scheduler: fakeScheduler, content });

function packOf(state: HomeState): Pack {
  if (!state.pack) throw new Error('no pack');
  return state.pack;
}
function onScreen(state: HomeState): Card {
  const card = currentCard(state.pack);
  if (!card) throw new Error('no card on screen');
  return card;
}
const open = (state: HomeState, clock: FakeClock): HomeState => ensurePack(state, dayKey(clock), ctxOf(clock));
const effectTypes = (result: Result): string[] => result.effects.map((effect) => effect.type);

/** Answers until a card of the wanted kind is on screen: Learn on new cards, Know on quizzes. */
function playUntil(state: HomeState, clock: FakeClock, wanted: (card: Card, state: HomeState) => boolean): HomeState {
  let current = state;
  for (let guard = 0; guard < 40 && !wanted(onScreen(current), current); guard += 1) {
    current =
      onScreen(current).type === 'new'
        ? answerNewCard(current, 'learn', ctxOf(clock)).state
        : answerQuiz(current, true, ctxOf(clock)).state;
  }
  return current;
}

describe('new card', () => {
  it('WF-30 Learn: learning, met now, no FSRS rating, no dot, returning card stays', () => {
    const clock = fakeClock();
    const s = open(scenario.fresh(clock).build(), clock);
    const result = answerNewCard(s, 'learn', ctxOf(clock));
    const word = wordOf(result.state.words, 'core1-01');
    expect([word.status, word.metAt, word.fsrs, word.dots]).toEqual(['learning', clock.now().toISOString(), null, 0]);
    expect(word.metOnHome).toBe(true);
    expect(packOf(result.state).cards.filter((card) => card.wordId === 'core1-01')).toHaveLength(2);
    expect(effectTypes(result)).toContain('refreshStrokePool');
    expect(packOf(result.state).position).toBe(1);
  });

  it('WF-31 I know it: known with 3 dots, never scheduled, returning card removed', () => {
    const clock = fakeClock();
    const s = open(scenario.fresh(clock).build(), clock);
    const result = answerNewCard(s, 'iKnowIt', ctxOf(clock));
    const word = wordOf(result.state.words, 'core1-01');
    expect([word.status, word.dots, word.fsrs, word.metAt]).toEqual(['known', 3, null, clock.now().toISOString()]);
    expect(packOf(result.state).cards.filter((card) => card.wordId === 'core1-01')).toHaveLength(1);
    expect(packOf(result.state).cards).toHaveLength(9);
    expect(effectTypes(result)).toContain('showUndo');
    expect(effectTypes(result)).toContain('reloadWidgets');
  });

  it('WF-35 log entries: Learn, I know it, quiz with correct', () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).build(), clock);
    s = answerNewCard(s, 'learn', ctxOf(clock)).state;
    s = answerNewCard(s, 'iKnowIt', ctxOf(clock)).state;
    s = playUntil(s, clock, (card) => card.type === 'returning');
    s = answerQuiz(s, false, ctxOf(clock)).state;
    const log = dayOf(s, dayKey(clock)).log;
    expect(log.slice(0, 2)).toEqual([
      { kind: 'wordLearn', id: 'core1-01' },
      { kind: 'wordKnewIt', id: 'core1-02' },
    ]);
    expect(log.at(-1)).toEqual({ kind: 'wordQuiz', id: 'core1-01', correct: false });
  });

  it('WF-38 undo I know it: word, pack, tick, log and a queued summary all go back', () => {
    const clock = fakeClock();
    const before = open(scenario.fresh(clock).withBar(9).build(), clock);
    const snapshot = JSON.parse(JSON.stringify(before));
    const slot = openUndo(before, clock.now());
    const after = answerNewCard(before, 'iKnowIt', ctxOf(clock)).state;
    expect(after.rewardQueue).toHaveLength(1);

    const restored = takeUndo(slot, clock.now());
    expect(restored).toEqual(snapshot);
    expect(wordOf(restored?.words ?? {}, 'core1-01').status).toBe('new');
    expect(restored?.pack?.cards).toHaveLength(10);
    expect(restored?.rewardQueue).toEqual([]);
  });
});

describe('quiz', () => {
  it("WF-32 a new word's first returning quiz is its first rating; later answers that day do not touch FSRS", () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).build(), clock);
    s = playUntil(s, clock, (card) => card.type === 'returning');
    const wordId = onScreen(s).wordId;
    expect(wordOf(s.words, wordId).fsrs).toBeNull();

    s = answerQuiz(s, false, ctxOf(clock)).state;
    const rated = wordOf(s.words, wordId).fsrs;
    expect(rated).not.toBeNull();
    expect(wordOf(s.words, wordId).lastRatedDay).toBe(dayKey(clock));

    clock.advanceMs(60_000);
    s = playUntil(s, clock, (card) => card.wordId === wordId);
    s = answerQuiz(s, true, ctxOf(clock)).state;
    expect(wordOf(s.words, wordId).fsrs).toEqual(rated);
  });

  it('WF-33 Know on a returning card gives no dot', () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).build(), clock);
    s = playUntil(s, clock, (card) => card.type === 'returning');
    const wordId = onScreen(s).wordId;
    s = answerQuiz(s, true, ctxOf(clock)).state;
    expect(wordOf(s.words, wordId).dots).toBe(0);
  });

  it('WF-33 Know on a strong or weak card gives one dot, once a day', () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).withLearning(['core1-20'], { r: 0.9 }).build(), clock);
    expect(onScreen(s)).toEqual({ wordId: 'core1-20', type: 'strong', sentenceIndex: 0 });
    s = answerQuiz(s, true, ctxOf(clock)).state;
    const word = wordOf(s.words, 'core1-20');
    expect([word.dots, word.lastDotDay]).toEqual([1, dayKey(clock)]);

    // Same day again (as a strong card of a later pack): no second dot.
    const again = { ...s, pack: { ...packOf(s), cards: [{ wordId: 'core1-20', type: 'strong' as const, sentenceIndex: 1 as const }], position: 0 } };
    expect(wordOf(answerQuiz(again, true, ctxOf(clock)).state.words, 'core1-20').dots).toBe(1);
  });

  it('WF-33 the third dot makes the word Known: out of FSRS, widgets reloaded', () => {
    const clock = fakeClock();
    const s = open(scenario.twoDotsDue(clock).build(), clock);
    expect(onScreen(s).type).toBe('strong');
    const result = answerQuiz(s, true, ctxOf(clock));
    const word = wordOf(result.state.words, 'core1-01');
    expect([word.status, word.dots, word.fsrs]).toEqual(['known', 3, null]);
    expect(effectTypes(result)).toContain('reloadWidgets');
  });

  it("WF-34 Don't know: same word 3 cards later as a loop card with the other sentence; the round grows", () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).build(), clock);
    s = playUntil(s, clock, (card) => card.type === 'returning');
    const card = onScreen(s);
    const index = packOf(s).position;
    const lengthBefore = packOf(s).cards.length;
    const barBefore = barText(dayOf(s, dayKey(clock)));

    s = answerQuiz(s, false, ctxOf(clock)).state;
    expect(packOf(s).cards).toHaveLength(lengthBefore + 1);
    expect(packOf(s).cards[index + 3]).toEqual({
      wordId: card.wordId,
      type: 'returning',
      sentenceIndex: card.sentenceIndex === 0 ? 1 : 0,
      loop: true,
    });
    expect(barBefore).toBe('3 / 10');
    expect(barText(dayOf(s, dayKey(clock)))).toBe('4 / 11');
    expect(wordOf(s.words, card.wordId).dots).toBe(0);
  });

  it("WF-34 Don't know repeats until Know, and goes to the end when fewer than 3 cards remain", () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).build(), clock);
    s = playUntil(s, clock, (card) => card.type === 'returning');
    // Walk to the last card of the pack.
    s = playUntil(s, clock, (_card, now) => packOf(now).position === packOf(now).cards.length - 1);
    const last = onScreen(s);
    s = answerQuiz(s, false, ctxOf(clock)).state;
    expect(onScreen(s)).toEqual({ ...last, sentenceIndex: last.sentenceIndex === 0 ? 1 : 0, loop: true });
    s = answerQuiz(s, false, ctxOf(clock)).state;
    expect(onScreen(s).wordId).toBe(last.wordId);
    expect(onScreen(s).sentenceIndex).toBe(last.sentenceIndex);
  });

  it('WF-36 answering the last card builds the next pack for the same day with no break', () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).build(), clock);
    for (let index = 0; index < 9; index += 1) {
      s = onScreen(s).type === 'new' ? answerNewCard(s, 'learn', ctxOf(clock)).state : answerQuiz(s, true, ctxOf(clock)).state;
    }
    expect(packOf(s).seq).toBe(1);
    // The 10th answer fills the bar too, so the summary is queued while the next pack is already built.
    s = answerQuiz(s, true, ctxOf(clock)).state;
    expect([packOf(s).seq, packOf(s).position, packOf(s).dayKey]).toEqual([2, 0, dayKey(clock)]);
    expect(packOf(s).cards.some((card) => card.type === 'new')).toBe(true);
    expect(s.rewardQueue.map((card) => card.type)).toEqual(['summary']);
  });

  it('WF-37 look-back holds the answered cards in order', () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).build(), clock);
    const first = onScreen(s);
    s = answerNewCard(s, 'learn', ctxOf(clock)).state;
    const second = onScreen(s);
    s = answerNewCard(s, 'learn', ctxOf(clock)).state;
    expect(packOf(s).history).toEqual([first, second]);
  });

  it('DB-17 nothing can be answered while a summary waits', () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).withBar(9).build(), clock);
    s = answerNewCard(s, 'learn', ctxOf(clock)).state;
    const blocked = answerNewCard(s, 'learn', ctxOf(clock));
    expect(blocked.state).toBe(s);
    expect(blocked.effects).toEqual([]);
  });

  it('DB-19 an answer after 4 AM counts on the new day and the old pack is dropped', () => {
    const clock = fakeClock('2026-11-16T23:30');
    let s = open(scenario.fresh(clock).build(), clock);
    clock.set('2026-11-17T04:05');
    s = answerNewCard(s, 'learn', ctxOf(clock)).state;
    expect(dayOf(s, '2026-11-17').ticks).toBe(1);
    expect(dayOf(s, '2026-11-16').ticks).toBe(0);
    expect([packOf(s).dayKey, packOf(s).seq, packOf(s).position]).toEqual(['2026-11-17', 1, 0]);
  });
});

describe('deck advance', () => {
  it('WF-50 meeting the last word completes the deck: reward queued, next part becomes current', () => {
    const clock = fakeClock();
    const s = open(scenario.deckLastWord(clock).build(), clock);
    expect(onScreen(s)).toEqual({ wordId: 'core1-20', type: 'new', sentenceIndex: 0 });
    const result = answerNewCard(s, 'learn', ctxOf(clock));
    expect(result.state.deck.currentDeckId).toBe('core2');
    expect(result.state.deck.completedDeckIds).toEqual(['core1']);
    expect(result.state.rewardQueue).toEqual([
      { type: 'deckComplete', deckId: 'core1', deckName: 'N5 Core 1', wordCount: 20, nextDeckId: 'core2', nextDeckName: 'N5 Core 2' },
    ]);
    expect(effectTypes(result)).toContain('queueReward');
  });

  it('RW-2 a summary and a deck complete from the same answer queue in that order', () => {
    const clock = fakeClock();
    const s = open(scenario.deckLastWord(clock).withBar(9).build(), clock);
    const result = answerNewCard(s, 'iKnowIt', ctxOf(clock));
    expect(result.state.rewardQueue.map((card) => card.type)).toEqual(['summary', 'deckComplete']);
  });

  it('WF-50 after the last part of a theme comes the first part of the next theme', () => {
    const clock = fakeClock();
    const core3 = content.decks[2]?.wordIds ?? [];
    const s = open(scenario.fresh(clock).withCurrentDeck('core3').withLearning(core3.slice(0, 19), { dueInDays: 4, r: 0.95 }).build(), clock);
    const result = answerNewCard(s, 'learn', ctxOf(clock));
    expect(result.state.deck.currentDeckId).toBe('food1');
  });

  it('WF-51 no next deck at this level: the current deck stays and the card has no next deck', () => {
    const clock = fakeClock();
    const food2 = content.decks[4]?.wordIds ?? [];
    const s = open(scenario.fresh(clock).withCurrentDeck('food2').withLearning(food2.slice(0, 19), { dueInDays: 4, r: 0.95 }).build(), clock);
    const result = answerNewCard(s, 'learn', ctxOf(clock));
    expect(result.state.deck.currentDeckId).toBe('food2');
    const card = result.state.rewardQueue[0];
    expect(card?.type === 'deckComplete' ? card.nextDeckId : 'x').toBeNull();
    const pack = packOf(result.state);
    expect(pack.cards.slice(pack.position).some((c) => c.type === 'new')).toBe(false);
  });
});
