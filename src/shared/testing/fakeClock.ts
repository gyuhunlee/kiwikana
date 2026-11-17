import type { Clock } from '../time/clock';
import { MS_PER_DAY, MS_PER_HOUR } from '../time/dayKey.logic';
import { fromLocal, shiftInstant } from '../time/zone.logic';

export interface FakeClock extends Clock {
  /** Local wall clock time in the clock's zone: `clock.set('2026-11-16T09:00')`. */
  set(localIso: string): void;
  setTimeZone(timeZone: string): void;
  advanceMs(ms: number): void;
  advanceHours(hours: number): void;
  advanceDays(days: number): void;
}

export function fakeClock(startLocalIso = '2026-11-16T09:00', startTimeZone = 'America/Los_Angeles'): FakeClock {
  let timeZone = startTimeZone;
  let instant = fromLocal(startLocalIso, timeZone);
  const advanceMs = (ms: number) => {
    instant = shiftInstant(instant, ms);
  };
  return {
    now: () => instant,
    timeZone: () => timeZone,
    set: (localIso) => {
      instant = fromLocal(localIso, timeZone);
    },
    setTimeZone: (next) => {
      timeZone = next;
    },
    advanceMs,
    advanceHours: (hours) => advanceMs(hours * MS_PER_HOUR),
    advanceDays: (days) => advanceMs(days * MS_PER_DAY),
  };
}
