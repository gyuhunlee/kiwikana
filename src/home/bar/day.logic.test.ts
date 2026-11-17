import { describe, expect, it } from 'vitest';
import { fakeClock } from '../../shared/testing/fakeClock';
import { scenario } from '../../shared/testing/scenarios';
import { addDays, dayKey } from '../../shared/time/dayKey.logic';
import { openUndo, takeUndo } from '../undo.logic';
import { barText, dayOf, dismissReward, ensureDay, selectRepairDay, tick, type BarState } from './day.logic';
import type { LogEntry, LogKind } from './day.types';
import { streak } from './streak.logic';

const know: LogEntry = { kind: 'wordQuiz', id: 'w', correct: true };
const dontKnow: LogEntry = { kind: 'wordQuiz', id: 'w', correct: false };

function ticks<S extends BarState>(state: S, today: string, entries: LogEntry[]): S {
  return entries.reduce((current, entry) => tick(current, today, entry).state, state);
}
const times = (count: number, entry: LogEntry = know): LogEntry[] => Array.from({ length: count }, () => entry);

describe('bar and rounds', () => {
  it('DB-2 an action returns a new state and leaves the old one untouched', () => {
    const before = scenario.fresh().withBar(3).build();
    const copy = JSON.parse(JSON.stringify(before));
    const after = tick(before, before.today, know).state;
    expect(before).toEqual(copy);
    expect(dayOf(after, before.today).ticks).toBe(4);
  });

  it('DB-3 undo inside 4 s gives back the exact state from before, after 4 s nothing', () => {
    const clock = fakeClock();
    const before = scenario.fresh().withBar(9).build();
    const slot = openUndo(before, clock.now());
    clock.advanceMs(3900);
    expect(takeUndo(slot, clock.now())).toEqual(before);
    clock.advanceMs(200);
    expect(takeUndo(slot, clock.now())).toBeNull();
  });

  it('DB-10 tick adds one and logs the entry', () => {
    const s = scenario.fresh().build();
    const { state, effects } = tick(s, s.today, know);
    expect(dayOf(state, s.today).ticks).toBe(1);
    expect(dayOf(state, s.today).log).toEqual([know]);
    expect(effects).toEqual([]);
  });

  it('DB-10 the 10th tick queues a summary with a copy of the log', () => {
    const s = scenario.fresh().withBar(9).build();
    const { state, effects } = tick(s, s.today, know);
    expect(effects).toHaveLength(1);
    const card = state.rewardQueue[0];
    expect(card?.type).toBe('summary');
    expect(card?.type === 'summary' ? card.log.length : 0).toBe(10);
  });

  const table: [string, LogEntry, number, number][] = [
    ['word Learn', { kind: 'wordLearn', id: 'w' }, 1, 0],
    ['word I know it', { kind: 'wordKnewIt', id: 'w' }, 1, 0],
    ['word quiz Know', know, 1, 0],
    ["word quiz Don't know", dontKnow, 1, 1],
    ['new kana Learn', { kind: 'kanaLearn', id: 'あ' }, 1, 0],
    ['new kana I know it', { kind: 'kanaKnewIt', id: 'あ' }, 1, 0],
    ['kana question right', { kind: 'kanaQuestion', id: 'あ', correct: true }, 1, 0],
    ['kana question wrong', { kind: 'kanaQuestion', id: 'あ', correct: false }, 1, 0],
    ['character traced', { kind: 'traced', id: '水' }, 1, 0],
  ];
  for (const [name, entry, tickBy, extraBy] of table) {
    it(`DB-11 ${name}: tick +${tickBy}, roundExtra +${extraBy}`, () => {
      const s = scenario.fresh().build();
      const day = dayOf(tick(s, s.today, entry).state, s.today);
      expect(day.ticks).toBe(tickBy);
      expect(day.roundExtra).toBe(extraBy);
    });
  }

  it('DB-12 bar text for round 1, later rounds and a repair round', () => {
    const s = scenario.missedYesterday().withBar(3).build();
    expect(barText(dayOf(s, s.today))).toBe('3 / 10');

    const roundTwo = dismissReward(ticks(s, s.today, times(7)), s.today);
    expect(barText(dayOf(roundTwo, s.today))).toBe('Round 2 · 0 / 10');

    const yesterday = addDays(s.today, -1);
    const repairing = selectRepairDay(roundTwo, s.today, yesterday);
    // 2026-11-16 is a Monday, so yesterday is Sunday.
    expect(barText(dayOf(repairing, s.today))).toBe('Repairing Sun · 0 / 10');
  });

  it("DB-13 Don't know at 6 / 10 gives 7 / 11", () => {
    const s = scenario.fresh().withBar(6).build();
    expect(barText(dayOf(tick(s, s.today, dontKnow).state, s.today))).toBe('7 / 11');
  });

  it("DB-13 Don't know on the 10th card gives 10 / 11 and no summary yet", () => {
    const s = scenario.fresh().withBar(9).build();
    const { state, effects } = tick(s, s.today, dontKnow);
    expect(barText(dayOf(state, s.today))).toBe('10 / 11');
    expect(effects).toEqual([]);
    expect(tick(state, s.today, know).effects).toHaveLength(1);
  });

  it('DB-14 wrong kana answers never change roundExtra', () => {
    const s = scenario.fresh().build();
    const after = ticks(s, s.today, times(5, { kind: 'kanaQuestion', id: 'あ', correct: false }));
    expect(dayOf(after, s.today).roundExtra).toBe(0);
  });

  it('DB-15 dismissing the summary starts the next round', () => {
    const s = scenario.fresh().withBar(8).build();
    const filled = ticks(s, s.today, [dontKnow, know, know]);
    const day = dayOf(dismissReward(filled, s.today), s.today);
    expect([day.roundNo, day.roundStart, day.roundExtra, day.log.length]).toEqual([2, 11, 0, 0]);
    expect(day.ticks).toBe(11);
  });

  it('DB-16 the goal counts when the summary is queued, not when it is dismissed', () => {
    const s = scenario.fresh().withBar(9).build();
    const { state } = tick(s, s.today, know);
    expect(state.rewardQueue).toHaveLength(1);
    expect(dayOf(state, s.today).goalDone).toBe(true);
  });

  it('DB-17 no tick while a summary waits', () => {
    const s = scenario.fresh().withBar(9).build();
    const filled = tick(s, s.today, know).state;
    const blocked = tick(filled, s.today, know);
    expect(blocked.state).toEqual(filled);
    expect(blocked.effects).toEqual([]);
  });

  it('DB-18 a new day starts fresh and the old day stays stored', () => {
    const clock = fakeClock();
    const s = scenario.fresh(clock).withBar(4).build();
    clock.advanceDays(1);
    const tomorrow = dayKey(clock);
    const next = ensureDay(s, tomorrow);
    expect(dayOf(next, tomorrow)).toEqual({ ...dayOf(next, tomorrow), ticks: 0, roundNo: 1, repairDay: null, log: [] });
    expect(dayOf(next, s.today).ticks).toBe(4);
    expect(dayOf(next, s.today).goalDone).toBe(false);
  });

  it('DB-19 an action after the day changed applies to the new day', () => {
    const clock = fakeClock('2026-11-16T23:00');
    const s = scenario.fresh(clock).withBar(4).build();
    clock.set('2026-11-17T04:01');
    const after = tick(s, dayKey(clock), know).state;
    expect(dayOf(after, '2026-11-17').ticks).toBe(1);
    expect(dayOf(after, '2026-11-16').ticks).toBe(4);
  });

  it('DB-33 any mix of modes fills round 1', () => {
    const s = scenario.fresh().build();
    const kinds: LogKind[] = ['wordLearn', 'kanaLearn', 'traced', 'kanaQuestion', 'wordKnewIt'];
    const mixed = [...kinds, ...kinds].map((kind): LogEntry => ({ kind, id: 'x', correct: true }));
    expect(dayOf(ticks(s, s.today, mixed), s.today).goalDone).toBe(true);
  });
});

describe('repair', () => {
  const setUp = () => {
    const s = scenario.missedYesterday().build();
    return { s, today: s.today, yesterday: addDays(s.today, -1) };
  };

  it('DB-41 tapping a repairable day sets repairDay; other days are ignored', () => {
    const { s, today, yesterday } = setUp();
    expect(dayOf(selectRepairDay(s, today, yesterday), today).repairDay).toBe(yesterday);
    expect(dayOf(selectRepairDay(s, today, addDays(today, -2)), today).repairDay).toBeNull();
    expect(dayOf(selectRepairDay(s, today, today), today).repairDay).toBeNull();
  });

  it('DB-42 picked before the goal: the round after the summary is the repair round', () => {
    const { s, today, yesterday } = setUp();
    const picked = selectRepairDay(s, today, yesterday);
    expect(barText(dayOf(ticks(picked, today, times(3)), today))).toBe('3 / 10');
    const roundTwo = dismissReward(ticks(picked, today, times(10)), today);
    expect(barText(dayOf(roundTwo, today))).toBe('Repairing Sun · 0 / 10');
  });

  it('DB-42 picked mid-round after the goal: the round after the current one is the repair round', () => {
    const { s, today, yesterday } = setUp();
    const midRoundTwo = ticks(dismissReward(ticks(s, today, times(10)), today), today, times(4));
    const picked = selectRepairDay(midRoundTwo, today, yesterday);
    expect(barText(dayOf(picked, today))).toBe('Round 2 · 4 / 10');
    const roundThree = dismissReward(ticks(picked, today, times(6)), today);
    expect(barText(dayOf(roundThree, today))).toBe('Repairing Sun · 0 / 10');
  });

  it('DB-43 filling the repair round repairs the day, clears repairDay and queues the normal summary', () => {
    const { s, today, yesterday } = setUp();
    const picked = selectRepairDay(s, today, yesterday);
    const roundTwo = dismissReward(ticks(picked, today, times(10)), today);
    const { state, effects } = tick(ticks(roundTwo, today, times(9)), today, know);
    expect(dayOf(state, yesterday).repaired).toBe(true);
    expect(dayOf(state, today).repairDay).toBeNull();
    expect(effects).toHaveLength(1);
    expect(state.rewardQueue[0]?.type).toBe('summary');
  });

  it('DB-44 picking another day replaces the first', () => {
    const s = scenario.fresh().installedDaysAgo(6).withStreak(3, 3).build();
    const first = selectRepairDay(s, s.today, addDays(s.today, -1));
    const second = selectRepairDay(first, s.today, addDays(s.today, -2));
    expect(dayOf(second, s.today).repairDay).toBe(addDays(s.today, -2));
  });

  it('DB-45 repairDay does not survive the rollover', () => {
    const { s, today, yesterday } = setUp();
    const picked = selectRepairDay(s, today, yesterday);
    const tomorrow = addDays(today, 1);
    expect(dayOf(ensureDay(picked, tomorrow), tomorrow).repairDay).toBeNull();
  });

  it('DB-46 streak 5, miss Sunday: 0 on Monday, 1 after round 1, 7 after the repair round', () => {
    const { s, today, yesterday } = setUp();
    expect(streak(s.days, today)).toBe(0);
    const picked = selectRepairDay(s, today, yesterday);
    const goal = ticks(picked, today, times(10));
    expect(streak(goal.days, today)).toBe(1);
    const repaired = ticks(dismissReward(goal, today), today, times(10));
    expect(streak(repaired.days, today)).toBe(7);
    expect(repaired.stats.bestStreak).toBe(7);
  });
});
