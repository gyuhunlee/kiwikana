import { addDays } from './dayKey.logic';
import { fromLocal, localDate, shiftInstant } from './zone.logic';

/**
 * Clock offset that makes app time read `hour:minute` local.
 * Always moves forward to the next time the wall clock shows it, so day logic never sees time run back.
 */
export function offsetForLocalTime(
  realNow: Date,
  currentOffsetMs: number,
  timeZone: string,
  hour: number,
  minute: number,
): number {
  const appNow = shiftInstant(realNow, currentOffsetMs);
  const hhmm = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const today = localDate(appNow, timeZone);
  const sameDay = fromLocal(`${today}T${hhmm}`, timeZone);
  const target = sameDay.getTime() > appNow.getTime()
    ? sameDay
    : fromLocal(`${addDays(today, 1)}T${hhmm}`, timeZone);
  return target.getTime() - realNow.getTime();
}
