import { describe, expect, it } from 'vitest';
import { rng } from '../../shared/random/rng.logic';
import { fakeClock, type FakeClock } from '../../shared/testing/fakeClock';
import { fakeScheduler } from '../../shared/testing/fakeScheduler';
import { fixtureContent } from '../../shared/testing/fixtures';
import { scenario } from '../../shared/testing/scenarios';
import { dayKey } from '../../shared/time/dayKey.logic';
import type { Ctx, HomeState } from '../home.types';
import { buildPack, classify, ensurePack, orderCards, type PackParts } from './pack.logic';
import { wordOf, type Card, type CardType, type Pack } from './words.types';

const content = fixtureContent();
const core1 = content.decks[0]?.wordIds ?? [];
const ctxOf = (clock: FakeClock, withContent = content): Ctx => ({ clock, scheduler: fakeScheduler, content: withContent });

function packOf(state: HomeState): Pack {
  if (!state.pack) throw new Error('no pack');
  return state.pack;
}
const types = (pack: Pack): CardType[] => pack.cards.map((card) => card.type);
const count = (pack: Pack, type: CardType): number => pack.cards.filter((card) => card.type === type).length;

/** `A`, `retA`, `weak`, `strong`: the notation used in the spec. */
function notation(cards: Card[]): string {
  const letters = new Map<string, string>();
  return cards
    .map((card) => {
      if (card.type === 'weak' || card.type === 'strong') return card.type;
      if (!letters.has(card.wordId)) letters.set(card.wordId, String.fromCharCode(65 + letters.size));
      return card.type === 'new' ? letters.get(card.wordId) : `ret${letters.get(card.wordId)}`;
    })
    .join(', ');
}

function parts(newCount: number, weakCount: number, strongCount: number): PackParts {
  const card = (wordId: string, type: CardType): Card => ({ wordId, type, sentenceIndex: 0 });
  return {
    pairs: Array.from({ length: newCount }, (_, i) => ({ fresh: card(`n${i}`, 'new'), returning: card(`n${i}`, 'returning') })),
    weak: Array.from({ length: weakCount }, (_, i) => card(`w${i}`, 'weak')),
    strong: Array.from({ length: strongCount }, (_, i) => card(`s${i}`, 'strong')),
  };
}

describe('card types', () => {
  it('WF-5 strong = learning, due today, R at least 0.70; weak = learning with R under 0.70, due or not', () => {
    const clock = fakeClock();
    const s = scenario
      .fresh(clock)
      .withLearning(['strong-due'], { dueInDays: 0, r: 0.7 })
      .withLearning(['strong-later'], { dueInDays: 3, r: 0.9 })
      .withLearning(['weak-due'], { dueInDays: -2, r: 0.5 })
      .withLearning(['weak-later'], { dueInDays: 2, r: 0.69 })
      .withKnown(['known'])
      .build();
    const { weak, strong } = classify(s.words, s.today, ctxOf(clock));
    expect(strong.map((w) => w.wordId)).toEqual(['strong-due']);
    expect(weak.map((w) => w.wordId)).toEqual(['weak-due', 'weak-later']);
  });

  it('WF-3 due today means the due date falls on today or earlier by day key', () => {
    const clock = fakeClock('2026-11-16T23:00');
    // Due in 4 hours is 03:00 tomorrow, which still belongs to today (4 AM rollover).
    const s = scenario.fresh(clock).withLearning(['a'], { dueInDays: 4 / 24 }).withLearning(['b'], { dueInDays: 6 / 24 }).build();
    expect(classify(s.words, s.today, ctxOf(clock)).strong.map((w) => w.wordId)).toEqual(['a']);
  });

  it('WF-11 weak is lowest R first; strong is most overdue first', () => {
    const clock = fakeClock();
    const s = scenario
      .fresh(clock)
      .withLearning(['w-mid'], { r: 0.5 })
      .withLearning(['w-low'], { r: 0.2 })
      .withLearning(['s-recent'], { dueInDays: 0, r: 0.9 })
      .withLearning(['s-old'], { dueInDays: -4, r: 0.8 })
      .build();
    const { weak, strong } = classify(s.words, s.today, ctxOf(clock));
    expect(weak.map((w) => w.wordId)).toEqual(['w-low', 'w-mid']);
    expect(strong.map((w) => w.wordId)).toEqual(['s-old', 's-recent']);
  });

  it('WF-13 a fresh card from Mark as learning counts as strong once its due day arrives', () => {
    const clock = fakeClock();
    const base = scenario.fresh(clock).build();
    const fresh = { ...wordOf(base.words, 'x'), status: 'learning' as const, fsrs: fakeScheduler.fresh(clock.now()) };
    const s = { ...base, words: { x: fresh } };
    expect(classify(s.words, s.today, ctxOf(clock)).strong.map((w) => w.wordId)).toEqual(['x']);
    clock.advanceDays(-1);
    expect(classify(s.words, dayKey(clock), ctxOf(clock)).strong).toEqual([]);
  });
});

describe('buildPack', () => {
  it('WF-10 a saved pack for the same day and seq comes back unchanged, position included', () => {
    const clock = fakeClock();
    const built = buildPack(scenario.fresh(clock).build(), dayKey(clock), 1, ctxOf(clock));
    const moved = { ...built, pack: { ...packOf(built), position: 4 } };
    expect(buildPack(moved, dayKey(clock), 1, ctxOf(clock))).toBe(moved);
  });

  it('WF-12 2 hard cards and the setting for new words; 3 hard and 2 new when more than 6 are weak', () => {
    const clock = fakeClock();
    const some = scenario.fresh(clock).withLearning(core1.slice(10, 16), { r: 0.5 }).withLearning(core1.slice(16, 20), { r: 0.9 });
    const few = packOf(buildPack(some.build(), dayKey(clock), 1, ctxOf(clock)));
    expect([count(few, 'weak'), count(few, 'new')]).toEqual([2, 3]);

    const many = scenario.fresh(clock).withLearning(core1.slice(8, 15), { r: 0.5 }).withLearning(core1.slice(15, 20), { r: 0.9 });
    const lots = packOf(buildPack(many.build(), dayKey(clock), 1, ctxOf(clock)));
    expect([count(lots, 'weak'), count(lots, 'new')]).toEqual([3, 2]);
  });

  it('WF-12 the setting can lower new words to 2', () => {
    const clock = fakeClock();
    const s = scenario.fresh(clock).withNewWordsPerDay(2).withLearning(core1.slice(10, 20), { r: 0.9 }).build();
    expect(count(packOf(buildPack(s, s.today, 1, ctxOf(clock))), 'new')).toBe(2);
  });

  it('WF-14 fill order: new, a returning card for each, hard cards, then strong until 10', () => {
    const clock = fakeClock();
    const s = scenario.fresh(clock).withLearning(core1.slice(5, 8), { r: 0.5 }).withLearning(core1.slice(8, 20), { r: 0.9 }).build();
    const pack = packOf(buildPack(s, s.today, 1, ctxOf(clock)));
    expect(pack.cards).toHaveLength(10);
    expect([count(pack, 'new'), count(pack, 'returning'), count(pack, 'weak'), count(pack, 'strong')]).toEqual([3, 3, 2, 2]);
  });

  it('WF-15 day 1 with nothing to review: 5 new + 5 returning', () => {
    const clock = fakeClock();
    const pack = packOf(buildPack(scenario.fresh(clock).build(), dayKey(clock), 1, ctxOf(clock)));
    expect([count(pack, 'new'), count(pack, 'returning')]).toEqual([5, 5]);
  });

  it('WF-15 a single leftover slot stays empty', () => {
    const clock = fakeClock();
    // 3 new + 3 returning + 1 strong = 7. One more pair fits (9). The last slot stays empty.
    const s = scenario.fresh(clock).withLearning(core1.slice(19, 20), { r: 0.9 }).build();
    const pack = packOf(buildPack(s, s.today, 1, ctxOf(clock)));
    expect(pack.cards).toHaveLength(9);
    expect(count(pack, 'new')).toBe(4);
  });

  it('WF-16 new words are the next unseen words in deck order and run on into the next deck', () => {
    const clock = fakeClock();
    const s = scenario.fresh(clock).withKnown(core1.slice(0, 18)).build();
    const pack = packOf(buildPack(s, s.today, 1, ctxOf(clock)));
    const fresh = pack.cards.filter((card) => card.type === 'new').map((card) => card.wordId);
    expect(fresh).toEqual(['core1-19', 'core1-20', 'core2-01', 'core2-02', 'core2-03']);
  });

  it('WF-16 new words pause at a deck that is not on the phone yet', () => {
    const clock = fakeClock();
    const offline = { ...content, readyDeckIds: ['core1'] };
    const s = scenario.fresh(clock).withKnown(core1.slice(0, 18)).build();
    const pack = packOf(buildPack(s, s.today, 1, ctxOf(clock, offline)));
    expect(pack.cards.filter((card) => card.type === 'new').map((card) => card.wordId)).toEqual(['core1-19', 'core1-20']);
  });

  it('WF-17 nothing unseen and nothing due or weak gives an empty pack', () => {
    const clock = fakeClock();
    const s = scenario.allKnown(clock).build();
    expect(packOf(buildPack(s, s.today, 1, ctxOf(clock))).cards).toEqual([]);
  });

  it('WF-18 the two sentences alternate on every appearance of a word', () => {
    const clock = fakeClock();
    const first = buildPack(scenario.fresh(clock).withLearning(['core1-20'], { r: 0.9 }).build(), dayKey(clock), 1, ctxOf(clock));
    const cardsOf = (state: HomeState, wordId: string) => packOf(state).cards.filter((card) => card.wordId === wordId);
    expect(cardsOf(first, 'core1-01').map((card) => card.sentenceIndex)).toEqual([0, 1]);
    expect(cardsOf(first, 'core1-20').map((card) => card.sentenceIndex)).toEqual([0]);

    clock.advanceDays(1);
    const second = buildPack({ ...first, pack: null }, dayKey(clock), 1, ctxOf(clock));
    expect(cardsOf(second, 'core1-20').map((card) => card.sentenceIndex)).toEqual([1]);
  });

  it('WF-43 a change to new words per day leaves the saved pack alone and applies to the next one', () => {
    const clock = fakeClock();
    const strong = scenario.fresh(clock).withLearning(core1.slice(6, 20), { r: 0.9 });
    const built = buildPack(strong.build(), dayKey(clock), 1, ctxOf(clock));
    const changed = { ...built, newWordsPerDay: 2 as const };
    expect(buildPack(changed, dayKey(clock), 1, ctxOf(clock)).pack).toBe(built.pack);
    expect(count(packOf(buildPack(changed, dayKey(clock), 2, ctxOf(clock))), 'new')).toBe(2);
  });

  it('WF-44 at the rollover the unfinished pack is dropped and a new one is built', () => {
    const clock = fakeClock();
    const built = ensurePack(scenario.fresh(clock).build(), dayKey(clock), ctxOf(clock));
    const half = { ...built, pack: { ...packOf(built), position: 3 } };
    clock.advanceDays(1);
    const next = packOf(ensurePack(half, dayKey(clock), ctxOf(clock)));
    expect([next.dayKey, next.seq, next.position]).toEqual([dayKey(clock), 1, 0]);
  });

  it('WF-51 no next deck at this level: packs hold reviews only', () => {
    const clock = fakeClock();
    const everything = content.decks.flatMap((deck) => deck.wordIds);
    const s = scenario.fresh(clock).withKnown(everything.slice(0, 95)).withLearning(everything.slice(95), { r: 0.9 }).build();
    const pack = packOf(buildPack(s, s.today, 1, ctxOf(clock)));
    expect(types(pack)).toEqual(['strong', 'strong', 'strong', 'strong', 'strong']);
  });
});

describe('order', () => {
  it('WF-25 reference output for 3 new, 2 weak, 2 strong', () => {
    expect(notation(orderCards(parts(3, 2, 2)))).toBe('strong, A, B, weak, retA, C, retB, weak, strong, retC');
  });

  it('WF-26 first-days output for 5 new and nothing else', () => {
    expect(notation(orderCards(parts(5, 0, 0)))).toBe('A, B, C, retA, D, retB, E, retC, retD, retE');
  });

  it('WF-20 first card is strong if any exists, else new', () => {
    expect(orderCards(parts(3, 2, 1))[0]?.type).toBe('strong');
    expect(orderCards(parts(3, 2, 0))[0]?.type).toBe('new');
  });

  it('WF-21 a new card sits within the first 3 positions', () => {
    for (const p of [parts(3, 2, 2), parts(2, 3, 3), parts(2, 3, 1), parts(1, 3, 5)]) {
      expect(orderCards(p).slice(0, 3).map((card) => card.type)).toContain('new');
    }
  });

  it('WF-22 a returning card is at least 2 after its new card, or directly after when that is impossible', () => {
    const ordered = orderCards(parts(4, 1, 1));
    for (const card of ordered.filter((c) => c.type === 'new')) {
      const newIndex = ordered.indexOf(card);
      const returnIndex = ordered.findIndex((c) => c.type === 'returning' && c.wordId === card.wordId);
      expect(returnIndex).toBeGreaterThanOrEqual(newIndex + 2);
    }
    expect(notation(orderCards(parts(1, 0, 0)))).toBe('A, retA');
  });

  it('WF-23 never two weak cards next to each other', () => {
    for (const p of [parts(3, 2, 2), parts(2, 3, 3), parts(2, 3, 2), parts(3, 3, 1), parts(3, 3, 0), parts(0, 3, 4)]) {
      const ordered = orderCards(p);
      ordered.forEach((card, index) => {
        expect(card.type === 'weak' && ordered[index + 1]?.type === 'weak').toBe(false);
      });
    }
  });

  it('WF-24 last card is returning or strong when one exists', () => {
    for (const p of [parts(3, 2, 2), parts(3, 0, 4), parts(2, 3, 3), parts(0, 3, 7), parts(5, 0, 0), parts(3, 3, 0)]) {
      const last = orderCards(p).at(-1)?.type ?? '';
      expect(['returning', 'strong']).toContain(last);
    }
  });

  it('WF-27 WF-6 200 seeded random states: every pack keeps the ordering rules and holds no Known word', () => {
    const everything = content.decks.flatMap((deck) => deck.wordIds);
    for (let seed = 1; seed <= 200; seed += 1) {
      const random = rng(seed);
      const pick = (max: number) => Math.floor(random.next() * (max + 1));
      const clock = fakeClock();
      const metCount = pick(100);
      let builder = scenario.fresh(clock);
      everything.slice(0, metCount).forEach((wordId) => {
        const roll = random.next();
        if (roll < 0.25) builder = builder.withKnown([wordId]);
        else builder = builder.withLearning([wordId], { r: 0.3 + random.next() * 0.7, dueInDays: pick(8) - 4 });
      });
      const state = builder.withNewWordsPerDay(random.next() < 0.5 ? 2 : 3).build();
      const pack = packOf(buildPack(state, state.today, 1, ctxOf(clock)));
      const cards = pack.cards;
      const label = `seed ${seed}: ${notation(cards)}`;
      const has = (type: CardType) => cards.some((card) => card.type === type);
      const strongCount = count(pack, 'strong');
      const weakCount = count(pack, 'weak');

      expect(cards.length).toBeLessThanOrEqual(10);
      // WF-6
      cards.forEach((card) => expect(`${label} ${wordOf(state.words, card.wordId).status}`).not.toContain('known'));
      if (cards.length === 0) continue;
      // WF-20
      expect(`${label} first=${cards[0]?.type}`).toContain(has('strong') ? 'first=strong' : has('new') ? 'first=new' : 'first=weak');
      // WF-21
      if (has('new')) expect(`${label} ${cards.slice(0, 3).map((c) => c.type).join()}`).toContain('new');
      // WF-22
      cards.forEach((card, index) => {
        if (card.type !== 'new') return;
        const returnIndex = cards.findIndex((c) => c.type === 'returning' && c.wordId === card.wordId);
        expect(`${label} gap=${returnIndex - index >= 2}`).toContain('gap=true');
      });
      // WF-23. With no new words, 2 strong cards are spoken for (first and last), so it needs enough others.
      if (count(pack, 'new') >= 2 || weakCount <= 1 || strongCount > weakCount) {
        cards.forEach((card, index) => {
          expect(`${label} ${card.type === 'weak' && cards[index + 1]?.type === 'weak'}`).not.toContain('true');
        });
      }
      // WF-24
      if (has('returning') || strongCount >= 2) {
        expect(`${label} last=${cards.at(-1)?.type}`).not.toContain('last=weak');
        expect(`${label} last=${cards.at(-1)?.type}`).not.toContain('last=new');
      }
    }
  });
});
