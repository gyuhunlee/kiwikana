import { describe, expect, it } from 'vitest';
import { scenario } from '../../shared/testing/scenarios';
import { addDays } from '../../shared/time/dayKey.logic';
import { newDay } from './day.logic';
import { bestStreak, dayCounts, repairMessage, streak, weekCells } from './streak.logic';

describe('streak', () => {
  it('DB-30 a day counts if the goal was done or it was repaired', () => {
    expect(dayCounts({ ...newDay(), goalDone: true })).toBe(true);
    expect(dayCounts({ ...newDay(), repaired: true })).toBe(true);
    expect(dayCounts({ ...newDay(), ticks: 9 })).toBe(false);
    expect(dayCounts(undefined)).toBe(false);
  });

  it('DB-31 an unfinished today does not break the streak', () => {
    const s = scenario.fresh().installedDaysAgo(5).withStreak(5).withBar(3).build();
    expect(streak(s.days, s.today)).toBe(5);
  });

  it('DB-31 today counts once its goal is done', () => {
    const s = scenario.fresh().installedDaysAgo(5).withStreak(5).build();
    const days = { ...s.days, [s.today]: { ...newDay(), goalDone: true } };
    expect(streak(days, s.today)).toBe(6);
  });

  it('DB-31 a missed yesterday ends the streak', () => {
    const s = scenario.missedYesterday().build();
    expect(streak(s.days, s.today)).toBe(0);
  });

  it('DB-32 best streak only goes up', () => {
    const s = scenario.fresh().installedDaysAgo(5).withStreak(5).build();
    expect(bestStreak(3, s.days, s.today)).toBe(5);
    expect(bestStreak(9, s.days, s.today)).toBe(9);
  });

  it('DB-40 the week sheet lists 7 days ending today; only missed days since install are repairable', () => {
    const s = scenario.fresh().installedDaysAgo(3).withStreak(1, 3).build();
    const cells = weekCells(s.days, s.today, s.stats.installDay);
    expect(cells.map((cell) => cell.dayKey)).toEqual(Array.from({ length: 7 }, (_, i) => addDays(s.today, i - 6)));
    expect(cells[6]?.isToday).toBe(true);
    // -6..-4 before install, -3 done, -2 and -1 missed, today never repairable.
    expect(cells.map((cell) => cell.repairable)).toEqual([false, false, false, false, true, true, false]);
    expect(cells.map((cell) => cell.done)).toEqual([false, false, false, true, false, false, false]);
  });

  it('DB-41 the sheet says which weekday the extra cards fill', () => {
    expect(repairMessage('2026-11-15')).toBe("Do 10 extra cards after today's goal to fill Sunday.");
  });
});
