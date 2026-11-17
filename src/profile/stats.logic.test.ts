import { describe, expect, it } from 'vitest';
import { newDay } from '../home/bar/day.logic';
import { bestStreak, streak } from '../home/bar/streak.logic';
import { newKana } from '../home/kana/levels.logic';
import { fakeClock } from '../shared/testing/fakeClock';
import { fixtureDecks } from '../shared/testing/fixtures';
import { scenario } from '../shared/testing/scenarios';
import { decksCompleted, kanaLearned, milestone, upNext, weekAccuracy, weekAverage, weekBars, wordsKnown, wordsMet } from './stats.logic';

const zone = 'America/Los_Angeles';
const decks = fixtureDecks();
const core1 = decks[0]?.wordIds ?? [];

// 2026-11-16 is a Monday; Wednesday the 18th is used so the week has past, present and future days.
const midWeek = () => {
  const clock = fakeClock('2026-11-18T09:00');
  const s = scenario.fresh(clock).installedDaysAgo(10).withStreak(2).withBar(4).build();
  return { clock, s };
};

describe('profile stats', () => {
  it('PF-1 streak and best streak come from the day rules', () => {
    const { s } = midWeek();
    expect([streak(s.days, s.today), bestStreak(s.stats.bestStreak, s.days, s.today)]).toEqual([2, 2]);
  });

  it('PF-2 week bars: ticks per day Monday to Sunday, dark when the goal was done or the day repaired', () => {
    const { s } = midWeek();
    const bars = weekBars({ ...s.days, '2026-11-15': { ...newDay(), ticks: 3, repaired: true } }, s.today);
    expect(bars.map((bar) => bar.dayKey.slice(8))).toEqual(['16', '17', '18', '19', '20', '21', '22']);
    expect(bars.map((bar) => bar.ticks)).toEqual([10, 10, 4, 0, 0, 0, 0]);
    expect(bars.map((bar) => bar.done)).toEqual([true, true, false, false, false, false, false]);
    expect(bars.map((bar) => bar.future)).toEqual([false, false, false, true, true, true, true]);
  });

  it('PF-2 the week can start on Sunday', () => {
    const { s } = midWeek();
    const bars = weekBars({ ...s.days, '2026-11-15': { ...newDay(), ticks: 3, repaired: true } }, s.today, 0);
    expect(bars[0]).toEqual({ dayKey: '2026-11-15', ticks: 3, done: true, future: false });
  });

  it('PF-3 average: this week so far, today included, future days excluded, whole number', () => {
    const { s } = midWeek();
    expect(weekAverage(weekBars(s.days, s.today))).toEqual({ value: 8, text: '8 a day' });
    expect(weekAverage(weekBars({}, s.today))).toBeNull();
  });

  it('PF-4 PF-5 words met = not new, with today’s count; words known', () => {
    const clock = fakeClock();
    const s = scenario
      .fresh(clock)
      .withLearning(core1.slice(0, 5), { metDaysAgo: 3 })
      .withLearning(core1.slice(5, 7), { metDaysAgo: 0 })
      .withKnown(core1.slice(7, 10))
      .build();
    expect(wordsMet(s.words, s.today, zone)).toEqual({ total: 10, today: 2 });
    expect(wordsKnown(s.words)).toBe(3);
  });

  it('PF-6 milestone: at 120 met, 20 / 50 toward 150', () => {
    expect(milestone(120)).toEqual({ done: 20, step: 50, target: 150 });
    expect(milestone(0)).toEqual({ done: 0, step: 50, target: 50 });
    expect(milestone(50)).toEqual({ done: 0, step: 50, target: 100 });
  });

  it('PF-7 up next: current deck met / size and the words left', () => {
    const s = scenario.decksMixed().build();
    expect(upNext(decks, 'core1', s.words, true)).toEqual({ met: 10, size: 20, text: '10 words to finish this deck' });
    const done = scenario.fresh().withKnown(core1).build();
    expect(upNext(decks, 'core1', done.words, false)?.text).toBe('Deck finished');
  });

  it('PF-8 decks completed = decks with every word met', () => {
    const s = scenario.fresh().withLearning(core1).withKnown((decks[1]?.wordIds ?? []).slice(0, 19)).build();
    expect(decksCompleted(decks, s.words)).toBe(1);
  });

  it('PF-9 characters traced is the lifetime count', () => {
    expect(scenario.fresh().build().stats.charactersTraced).toBe(0);
  });

  it('PF-10 quiz accuracy this week as a whole percent; "–" with no graded answers', () => {
    const { s } = midWeek();
    const bars = weekBars(s.days, s.today);
    const graded = [
      { dayKey: '2026-11-15', correct: false },
      { dayKey: '2026-11-16', correct: true },
      { dayKey: '2026-11-17', correct: true },
      { dayKey: '2026-11-18', correct: false },
    ];
    expect(weekAccuracy(graded, bars)).toBe('67%');
    expect(weekAccuracy([], bars)).toBe('–');
  });

  it('PF-11 kana learned = Good or Excellent, both scripts', () => {
    const at = (score: number) => ({ ...newKana, score, seen: true });
    expect(kanaLearned([{ あ: at(4), い: at(3), う: at(7) }, { ア: at(6), イ: newKana }])).toBe(3);
  });
});
