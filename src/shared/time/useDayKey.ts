import { useSyncExternalStore } from 'react';
import { appClock, getClockOffsetMs, subscribeToClockOffset } from './appClock';
import { dayKey, type DayKey } from './dayKey.logic';

/** Today's day key. Re-renders when the dev menu moves the clock. Rollover while open is M3 (DB-19). */
export function useDayKey(): DayKey {
  useSyncExternalStore(subscribeToClockOffset, getClockOffsetMs);
  return dayKey(appClock);
}
