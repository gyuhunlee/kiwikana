import { describe, expect, it } from 'vitest';
import { fakeClock } from '../../shared/testing/fakeClock';
import { dayKey, dayKeyOf } from '../../shared/time/dayKey.logic';
import { instantFromIso } from '../../shared/time/zone.logic';
import { fsrsScheduler } from './fsrs.logic';

// These run against the real ts-fsrs. Written without being run (see docs/plan.md, M4 notes).
describe('fsrs wrapper', () => {
  it('WF-1 Know pushes the due date further out than Do not know', () => {
    const clock = fakeClock();
    const know = fsrsScheduler.rate(null, true, clock.now());
    const dontKnow = fsrsScheduler.rate(null, false, clock.now());
    expect(instantFromIso(know.due).getTime()).toBeGreaterThan(instantFromIso(dontKnow.due).getTime());
  });

  it('WF-1 the same answers give the same dates (no fuzz)', () => {
    const clock = fakeClock();
    expect(fsrsScheduler.rate(null, true, clock.now())).toEqual(fsrsScheduler.rate(null, true, clock.now()));
  });

  it('WF-2 a card with no review has no retrievability', () => {
    const clock = fakeClock();
    expect(fsrsScheduler.retrievability(fsrsScheduler.fresh(clock.now()), clock.now())).toBeNull();
  });

  it('WF-2 retrievability falls as days pass and is about 0.85 on the due date', () => {
    const clock = fakeClock();
    const card = fsrsScheduler.rate(null, true, clock.now());
    const justAfter = fsrsScheduler.retrievability(card, clock.now()) ?? 0;
    const atDue = fsrsScheduler.retrievability(card, instantFromIso(card.due)) ?? 0;
    expect(justAfter).toBeGreaterThan(atDue);
    expect(atDue).toBeGreaterThan(0.8);
    expect(atDue).toBeLessThan(0.9);
  });

  it('WF-3 a first Know is not due the same day', () => {
    const clock = fakeClock();
    const card = fsrsScheduler.rate(null, true, clock.now());
    expect(dayKeyOf(instantFromIso(card.due), clock.timeZone()) > dayKey(clock)).toBe(true);
  });
});
