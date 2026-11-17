import { describe, expect, it } from 'vitest';
import { fakeClock } from '../testing/fakeClock';
import { addDays, dayKey } from './dayKey.logic';

describe('dayKey', () => {
  it('DB-1 03:59 on the 17th belongs to the 16th', () => {
    expect(dayKey(fakeClock('2026-11-17T03:59'))).toBe('2026-11-16');
  });

  it('DB-1 04:00 on the 17th belongs to the 17th', () => {
    expect(dayKey(fakeClock('2026-11-17T04:00'))).toBe('2026-11-17');
  });

  it('DB-1 midday belongs to its own date', () => {
    expect(dayKey(fakeClock('2026-11-16T09:00'))).toBe('2026-11-16');
  });

  it('DB-1 before 4 AM on the 1st belongs to the last day of the previous month', () => {
    expect(dayKey(fakeClock('2026-03-01T02:30'))).toBe('2026-02-28');
    expect(dayKey(fakeClock('2027-01-01T00:10'))).toBe('2026-12-31');
  });

  it('DB-1 uses the device time zone at the moment of the call', () => {
    const clock = fakeClock('2026-11-17T03:59', 'America/Los_Angeles');
    expect(dayKey(clock)).toBe('2026-11-16');
    // Same instant is 20:59 on the 17th in Seoul.
    clock.setTimeZone('Asia/Seoul');
    expect(dayKey(clock)).toBe('2026-11-17');
  });

  it('DB-1 holds across a daylight saving change', () => {
    // US clocks go back on 2026-11-01 and forward on 2026-03-08.
    expect(dayKey(fakeClock('2026-11-01T03:59'))).toBe('2026-10-31');
    expect(dayKey(fakeClock('2026-11-01T04:00'))).toBe('2026-11-01');
    expect(dayKey(fakeClock('2026-03-08T03:59'))).toBe('2026-03-07');
    expect(dayKey(fakeClock('2026-03-08T04:00'))).toBe('2026-03-08');
  });
});

describe('addDays', () => {
  it('moves forward and back across months and years', () => {
    expect(addDays('2026-11-16', 1)).toBe('2026-11-17');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});
