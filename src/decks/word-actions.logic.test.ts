import { describe, expect, it } from 'vitest';
import { barText, dayOf } from '../home/bar/day.logic';
import type { Ctx, HomeState } from '../home/home.types';
import { openUndo, takeUndo } from '../home/undo.logic';
import { deckName, isDeckComplete, isDeckMastered } from '../home/words/deck-advance.logic';
import { classify, ensurePack } from '../home/words/pack.logic';
import { wordOf, type Pack } from '../home/words/words.types';
import { fakeClock, type FakeClock } from '../shared/testing/fakeClock';
import { fakeScheduler } from '../shared/testing/fakeScheduler';
import { fixtureContent } from '../shared/testing/fixtures';
import { scenario } from '../shared/testing/scenarios';
import { dayKey } from '../shared/time/dayKey.logic';
import { markKnown, markLearning, studyDeck } from './word-actions.logic';

const content = fixtureContent();
const [core1Deck] = content.decks;
const core1 = core1Deck?.wordIds ?? [];
const ctxOf = (clock: FakeClock): Ctx => ({ clock, scheduler: fakeScheduler, content });
const open = (state: HomeState, clock: FakeClock): HomeState => ensurePack(state, dayKey(clock), ctxOf(clock));
function packOf(state: HomeState): Pack {
  if (!state.pack) throw new Error('no pack');
  return state.pack;
}

describe('terms', () => {
  it('DK-1 complete = every word met; mastered = every word Known', () => {
    if (!core1Deck) throw new Error('no deck');
    const mixed = scenario.fresh().withLearning(core1.slice(0, 10)).withKnown(core1.slice(10)).build();
    expect([isDeckComplete(core1Deck, mixed.words), isDeckMastered(core1Deck, mixed.words)]).toEqual([true, false]);
    const all = scenario.fresh().withKnown(core1).build();
    expect(isDeckMastered(core1Deck, all.words)).toBe(true);
    expect(isDeckComplete(core1Deck, scenario.decksMixed().build().words)).toBe(false);
  });

  it('DK-2b display name = level + theme + part', () => {
    expect(content.decks.map(deckName)).toEqual(['N5 Core 1', 'N5 Core 2', 'N5 Core 3', 'N5 Food 1', 'N5 Food 2']);
  });
});

describe('to Known from Decks', () => {
  it('DK-40 WF-41 Known with 3 dots, out of FSRS, its unanswered cards leave the pack, no tick', () => {
    const clock = fakeClock();
    const s = open(scenario.fresh(clock).withLearning(['core1-20'], { r: 0.9 }).build(), clock);
    const lengthBefore = packOf(s).cards.length;
    const result = markKnown(s, 'core1-20', ctxOf(clock));
    const word = wordOf(result.state.words, 'core1-20');
    expect([word.status, word.dots, word.fsrs]).toEqual(['known', 3, null]);
    expect(packOf(result.state).cards.some((card) => card.wordId === 'core1-20')).toBe(false);
    expect(packOf(result.state).cards).toHaveLength(lengthBefore - 1);
    expect(dayOf(result.state, dayKey(clock)).ticks).toBe(0);
    expect(result.effects.map((effect) => effect.type)).toEqual(['reloadWidgets', 'showUndo']);
  });

  it('DK-40 a new word gets metAt now, takes both its cards out, and does not join the Stroke pool', () => {
    const clock = fakeClock();
    const s = open(scenario.fresh(clock).build(), clock);
    const result = markKnown(s, 'core1-02', ctxOf(clock));
    const word = wordOf(result.state.words, 'core1-02');
    expect([word.metAt, word.metOnHome]).toEqual([clock.now().toISOString(), false]);
    expect(packOf(result.state).cards).toHaveLength(8);
  });

  it('DK-40 RW-6 marking the last unseen word Known queues the deck complete card', () => {
    const clock = fakeClock();
    const s = scenario.deckLastWord(clock).build();
    const result = markKnown(s, 'core1-20', ctxOf(clock));
    expect(result.state.rewardQueue.map((card) => card.type)).toEqual(['deckComplete']);
    expect(barText(dayOf(result.state, dayKey(clock)))).toBe('0 / 10');
  });

  it('DK-42 undo restores the word, the pack and a queued deck complete card', () => {
    const clock = fakeClock();
    const before = open(scenario.deckLastWord(clock).build(), clock);
    const slot = openUndo(before, clock.now());
    const after = markKnown(before, 'core1-20', ctxOf(clock)).state;
    expect(after.rewardQueue).toHaveLength(1);
    expect(takeUndo(slot, clock.now())).toEqual(before);
  });
});

describe('to Learning from Decks', () => {
  it('DK-41 WF-42 0 dots, learning, fresh card due tomorrow, not added to today’s pack', () => {
    const clock = fakeClock();
    const s = open(scenario.decksMixed(clock).build(), clock);
    const result = markLearning(s, 'core1-07', ctxOf(clock));
    const word = wordOf(result.state.words, 'core1-07');
    expect([word.status, word.dots, word.fsrs?.lastReview]).toEqual(['learning', 0, null]);
    expect(result.state.pack).toBe(s.pack);
    expect(classify(result.state.words, dayKey(clock), ctxOf(clock)).strong.map((w) => w.wordId)).not.toContain('core1-07');

    clock.advanceDays(1);
    expect(classify(result.state.words, dayKey(clock), ctxOf(clock)).strong.map((w) => w.wordId)).toContain('core1-07');
    expect(result.effects.map((effect) => effect.type)).toContain('showUndo');
  });

  it('DK-41 the deck loses Mastered', () => {
    if (!core1Deck) throw new Error('no deck');
    const clock = fakeClock();
    const s = scenario.fresh(clock).withKnown(core1).build();
    const after = markLearning(s, 'core1-01', ctxOf(clock)).state;
    expect(isDeckMastered(core1Deck, after.words)).toBe(false);
  });
});

describe('Study this deck', () => {
  it('WF-40 DK-27 unanswered new cards and their returning cards become the new deck’s words, same positions', () => {
    const clock = fakeClock();
    const s = open(scenario.fresh(clock).withLearning(['core1-20'], { r: 0.9 }).build(), clock);
    const before = packOf(s);
    const result = studyDeck(s, 'food1', ctxOf(clock));
    const after = packOf(result.state);

    expect(result.state.deck.currentDeckId).toBe('food1');
    expect(after.cards.map((card) => card.type)).toEqual(before.cards.map((card) => card.type));
    expect(after.cards.filter((card) => card.type === 'new').map((card) => card.wordId)).toEqual([
      'food1-01',
      'food1-02',
      'food1-03',
      'food1-04',
    ]);
    after.cards.forEach((card, index) => {
      const old = before.cards[index];
      if (old?.type === 'strong') expect(card).toEqual(old);
      else expect(card.wordId.startsWith('food1-')).toBe(true);
    });
    expect(barText(dayOf(result.state, dayKey(clock)))).toBe('0 / 10');
  });

  it('WF-40 answered cards and the returning card of a word already learned stay', () => {
    const clock = fakeClock();
    let s = open(scenario.fresh(clock).build(), clock);
    // Learn A by hand: status + position, as the answer logic would leave it.
    const learned = { ...wordOf(s.words, 'core1-01'), status: 'learning' as const };
    s = { ...s, words: { ...s.words, 'core1-01': learned }, pack: { ...packOf(s), position: 1 } };
    const after = packOf(studyDeck(s, 'food1', ctxOf(clock)).state);
    expect(after.cards[0]?.wordId).toBe('core1-01');
    expect(after.cards.filter((card) => card.wordId === 'core1-01').map((card) => card.type)).toEqual(['new', 'returning']);
    expect(after.cards.filter((card) => card.wordId.startsWith('core1-'))).toHaveLength(2);
  });
});
