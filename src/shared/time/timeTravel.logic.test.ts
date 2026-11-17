import { describe, expect, it } from 'vitest';
import { offsetForLocalTime } from './timeTravel.logic';
import { formatLocal, fromLocal, shiftInstant } from './zone.logic';

const zone = 'America/Los_Angeles';
const appTime = (realNow: Date, offsetMs: number) => formatLocal(shiftInstant(realNow, offsetMs), zone);

describe('offsetForLocalTime', () => {
  it('jumps to later the same day when the time has not passed yet', () => {
    const realNow = fromLocal('2026-11-16T02:00', zone);
    const offset = offsetForLocalTime(realNow, 0, zone, 3, 59);
    expect(appTime(realNow, offset)).toBe('2026-11-16 03:59');
  });

  it('jumps to the next day when the time has already passed', () => {
    const realNow = fromLocal('2026-11-16T09:00', zone);
    const offset = offsetForLocalTime(realNow, 0, zone, 3, 59);
    expect(appTime(realNow, offset)).toBe('2026-11-17 03:59');
  });

  it('starts from app time, not real time, and never goes back', () => {
    const realNow = fromLocal('2026-11-16T09:00', zone);
    const at359 = offsetForLocalTime(realNow, 0, zone, 3, 59);
    const at401 = offsetForLocalTime(realNow, at359, zone, 4, 1);
    expect(appTime(realNow, at401)).toBe('2026-11-17 04:01');
    const againAt359 = offsetForLocalTime(realNow, at401, zone, 3, 59);
    expect(appTime(realNow, againAt359)).toBe('2026-11-18 03:59');
  });
});

describe('fromLocal', () => {
  it('reads wall clock time in the given zone', () => {
    expect(fromLocal('2026-11-16T09:00', zone).toISOString()).toBe('2026-11-16T17:00:00.000Z');
    expect(fromLocal('2026-07-01T09:00', zone).toISOString()).toBe('2026-07-01T16:00:00.000Z');
    expect(fromLocal('2026-11-16T09:00', 'Asia/Seoul').toISOString()).toBe('2026-11-16T00:00:00.000Z');
  });
});
