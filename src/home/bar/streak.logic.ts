import { addDays, weekdayLong, type DayKey } from '../../shared/time/dayKey.logic';
import type { DayState } from './day.types';

export type Days = Readonly<Record<DayKey, DayState>>;

// DB-30
export function dayCounts(day: DayState | undefined): boolean {
  return day !== undefined && (day.goalDone || day.repaired);
}

// DB-31: an unfinished today does not break the streak.
export function streak(days: Days, today: DayKey): number {
  let cursor = dayCounts(days[today]) ? today : addDays(today, -1);
  let length = 0;
  while (dayCounts(days[cursor])) {
    length += 1;
    cursor = addDays(cursor, -1);
  }
  return length;
}

// DB-32
export function bestStreak(previousBest: number, days: Days, today: DayKey): number {
  return Math.max(previousBest, streak(days, today));
}

// DB-40
export function isRepairable(days: Days, today: DayKey, installDay: DayKey, key: DayKey): boolean {
  return key < today && key >= addDays(today, -6) && key >= installDay && !dayCounts(days[key]);
}

export interface WeekCell {
  dayKey: DayKey;
  done: boolean;
  isToday: boolean;
  repairable: boolean;
}

// DB-40, DB-61: the last 7 days ending today, oldest first.
export function weekCells(days: Days, today: DayKey, installDay: DayKey): WeekCell[] {
  return Array.from({ length: 7 }, (_, index) => {
    const key = addDays(today, index - 6);
    return {
      dayKey: key,
      done: dayCounts(days[key]),
      isToday: key === today,
      repairable: isRepairable(days, today, installDay, key),
    };
  });
}

// DB-41
export function repairMessage(target: DayKey): string {
  return `Do 10 extra cards after today's goal to fill ${weekdayLong(target)}.`;
}
