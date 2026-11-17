import { systemClock, type Clock } from './clock';
import { shiftInstant } from './zone.logic';

// The one clock the app reads. The offset is only ever non-zero in dev builds (dev menu time travel).
let offsetMs = 0;
const listeners = new Set<() => void>();

export const appClock: Clock = {
  now: () => shiftInstant(systemClock.now(), offsetMs),
  timeZone: () => systemClock.timeZone(),
};

export function getClockOffsetMs(): number {
  return offsetMs;
}

export function setClockOffsetMs(nextOffsetMs: number): void {
  offsetMs = nextOffsetMs;
  listeners.forEach((listener) => listener());
}

export function subscribeToClockOffset(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
