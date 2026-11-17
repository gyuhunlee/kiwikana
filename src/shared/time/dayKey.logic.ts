import type { Clock } from './clock';
import { formatDate, localParts } from './zone.logic';

/** Local date string `YYYY-MM-DD`. Every "today" in the app is one of these. */
export type DayKey = string;

export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
const ROLLOVER_HOUR = 4;

// DB-1: the day turns over when the local wall clock reads 04:00, also on daylight saving days.
export function dayKeyOf(instant: Date, timeZone: string): DayKey {
  const parts = localParts(instant, timeZone);
  const date = formatDate(parts);
  return parts.hour < ROLLOVER_HOUR ? addDays(date, -1) : date;
}

export function dayKey(clock: Clock): DayKey {
  return dayKeyOf(clock.now(), clock.timeZone());
}

export function addDays(key: DayKey, days: number): DayKey {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** 0 = Sunday. */
export function weekdayIndex(key: DayKey): number {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function weekdayShort(key: DayKey): string {
  return WEEKDAYS_SHORT[weekdayIndex(key)] ?? '';
}

export function weekdayLong(key: DayKey): string {
  return WEEKDAYS_LONG[weekdayIndex(key)] ?? '';
}
