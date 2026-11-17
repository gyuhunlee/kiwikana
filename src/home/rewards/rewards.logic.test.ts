import { describe, expect, it } from 'vitest';
import { fakeClock } from '../../shared/testing/fakeClock';
import { scenario } from '../../shared/testing/scenarios';
import { dayKey } from '../../shared/time/dayKey.logic';
import { dayOf, dismissReward, tick } from '../bar/day.logic';
import type { LogEntry } from '../bar/day.types';
import { openUndo, takeUndo } from '../undo.logic';
import { enqueueRewards, headReward, rewardMoment, withoutHead } from './queue.logic';
import type { DeckCompleteCard, RowUnlockCard, SummaryCard } from './reward.types';
import { buildSummary, summaryTitle } from './summary.logic';

const summary: SummaryCard = { type: 'summary', dayKey: '2026-11-16', roundNo: 1, repair: false, log: [] };
const rowUnlock: RowUnlockCard = {
  type: 'rowUnlock',
  script: 'hiragana',
  finishedGroupId: 'a',
  newGroupId: 'ka',
  kana: ['か', 'き', 'く', 'け', 'こ'],
  unlockedCount: 10,
};
const deckComplete: DeckCompleteCard = {
  type: 'deckComplete',
  deckId: 'core1',
  deckName: 'N5 Core 1',
  wordCount: 20,
  nextDeckId: 'core2',
  nextDeckName: 'N5 Core 2',
};
const know: LogEntry = { kind: 'wordQuiz', id: 'w', correct: true };

describe('reward queue', () => {
  it('RW-1 the feed shows the head of the queue; an empty queue shows the exercise', () => {
    expect(headReward([])).toBeNull();
    expect(headReward([rowUnlock, summary])).toEqual(rowUnlock);
  });

  it('RW-2 cards from one action are ordered summary, row unlock, deck complete', () => {
    const queued = enqueueRewards([], [deckComplete, rowUnlock, summary]);
    expect(queued.map((card) => card.type)).toEqual(['summary', 'rowUnlock', 'deckComplete']);
  });

  it('RW-2 cards already waiting stay in front', () => {
    const queued = enqueueRewards([deckComplete], [rowUnlock, summary]);
    expect(queued.map((card) => card.type)).toEqual(['deckComplete', 'summary', 'rowUnlock']);
  });

  it('RW-3 the button removes the card; dismissing a summary starts the next round', () => {
    expect(withoutHead([summary, rowUnlock])).toEqual([rowUnlock]);
    const s = scenario.fresh().withBar(9).build();
    const dismissed = dismissReward(tick(s, s.today, know).state, s.today);
    expect(dismissed.rewardQueue).toEqual([]);
    expect(dayOf(dismissed, s.today).roundNo).toBe(2);
  });

  it('RW-4 a summary carried over the rollover shows first and leaves the new day alone', () => {
    const clock = fakeClock();
    const s = scenario.fresh(clock).withBar(9).build();
    const filled = tick(s, s.today, know).state;
    clock.advanceDays(1);
    const tomorrow = dayKey(clock);
    expect(headReward(filled.rewardQueue)?.type).toBe('summary');
    const dismissed = dismissReward(filled, tomorrow);
    expect(dismissed.rewardQueue).toEqual([]);
    expect(dayOf(dismissed, tomorrow).roundNo).toBe(1);
    expect(dayOf(dismissed, s.today).roundNo).toBe(1);
  });

  it('RW-5 when a queued card becomes visible', () => {
    expect(rewardMoment('wordCard')).toBe('afterSlide');
    expect(rewardMoment('kanaQuestion')).toBe('afterContinue');
    expect(rewardMoment('newKanaCard')).toBe('afterTap');
    expect(rewardMoment('stroke')).toBe('afterSuccessPop');
  });

  it('RW-7 undo of the action that queued a card removes that card', () => {
    const clock = fakeClock();
    const before = scenario.fresh(clock).withBar(9).build();
    const slot = openUndo(before, clock.now());
    const after = tick(before, before.today, { kind: 'wordKnewIt', id: 'w' }).state;
    expect(after.rewardQueue).toHaveLength(1);
    expect(takeUndo(slot, clock.now())?.rewardQueue).toEqual([]);
  });
});

describe('summary card', () => {
  it('RW-10 the summary carries a copy of the round log', () => {
    const s = scenario.fresh().withBar(9).build();
    const { state } = tick(s, s.today, know);
    const card = state.rewardQueue[0];
    expect(card?.type === 'summary' ? card.log : []).toEqual(dayOf(state, s.today).log);
  });

  it('RW-11 round 1 is "Daily goal done"; later rounds rotate by round number', () => {
    expect([1, 2, 3, 4, 5, 6].map(summaryTitle)).toEqual([
      'Daily goal done',
      'Nice work',
      'On a roll',
      'Keep it up',
      'Great round',
      'Nice work',
    ]);
  });

  it('RW-12 counts, dots and sections come from the log', () => {
    const log: LogEntry[] = [
      { kind: 'wordLearn', id: 'ame' },
      { kind: 'wordKnewIt', id: 'mizu' },
      { kind: 'wordQuiz', id: 'ame', correct: true },
      { kind: 'wordQuiz', id: 'neko', correct: false },
      { kind: 'kanaLearn', id: 'あ' },
      { kind: 'kanaKnewIt', id: 'い' },
      { kind: 'kanaQuestion', id: 'あ', correct: true, levelUp: ['あ'] },
      { kind: 'traced', id: '水' },
    ];
    const summary = buildSummary(log);
    expect(summary.counts).toEqual({ words: 3, kana: 2, traced: 1 });
    expect(summary.dots).toEqual([true, false, true]);
    expect(summary.rightText).toBe('2 of 3 right');
    expect(summary.newWords).toEqual(['ame']);
    expect(summary.alreadyKnew).toEqual(['mizu', 'い']);
    expect(summary.levelUps).toEqual(['あ']);
    expect(summary.practiceAgain).toEqual(['neko']);
    expect(summary.sections).toEqual(['counts', 'dots', 'newWords', 'alreadyKnew', 'levelUps', 'practiceAgain']);
  });

  it('RW-12 empty sections are left out', () => {
    const summary = buildSummary([{ kind: 'traced', id: '水' }]);
    expect(summary.sections).toEqual(['counts']);
  });

  it('RW-12 limits: 4 new words, 8 already knew, 8 to practice again', () => {
    const many = (kind: LogEntry['kind']): LogEntry[] =>
      Array.from({ length: 12 }, (_, index) => ({ kind, id: `${kind}-${index}`, correct: false }));
    const summary = buildSummary([...many('wordLearn'), ...many('wordKnewIt'), ...many('wordQuiz')]);
    expect(summary.newWords).toHaveLength(4);
    expect(summary.alreadyKnew).toHaveLength(8);
    expect(summary.practiceAgain).toHaveLength(8);
  });

  it('RW-13 a word missed twice shows once under practice again and as two red dots', () => {
    const miss: LogEntry = { kind: 'wordQuiz', id: 'neko', correct: false };
    const summary = buildSummary([miss, miss, { kind: 'wordQuiz', id: 'neko', correct: true }]);
    expect(summary.practiceAgain).toEqual(['neko']);
    expect(summary.dots).toEqual([false, false, true]);
  });
});
