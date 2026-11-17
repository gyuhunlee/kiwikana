import type { Clock } from './clock';
import { formatDate, localParts } from './zone.logic';

/** Local date string `YYYY-MM-DD`. Every "today" in the app is one of these. */
export type DayKey = string;

export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
const ROLLOVER_HOUR = 4;

// DB-1: the day turns over when the local wall clock reads 04:00, also on daylight saving days.
export function dayKey(clock: Clock): DayKey {
  const parts = localParts(clock.now(), clock.timeZone());
  const date = formatDate(parts);
  return parts.hour < ROLLOVER_HOUR ? addDays(date, -1) : date;
}

export function addDays(key: DayKey, days: number): DayKey {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
