import type { FsrsCard, Scheduler } from '../../home/words/words.types';
import { MS_PER_DAY } from '../time/dayKey.logic';
import { instantFromIso, shiftInstant } from '../time/zone.logic';

// A stand-in for FSRS with the same shape and simple arithmetic, so feed rules can be tested
// without the library: first Know is due in 5 days, each later Know multiplies the gap by 2.5,
// Don't know is due in 1 day. Retrievability is 0.85 on the due date. `fixedR` pins it for a test.
const FIRST_GAP_DAYS = 5;
const GROWTH = 2.5;

export function fakeCard(now: Date, options: { dueInDays: number; r?: number }): FsrsCard {
  return {
    due: shiftInstant(now, options.dueInDays * MS_PER_DAY).toISOString(),
    lastReview: shiftInstant(now, -MS_PER_DAY).toISOString(),
    data: { gapDays: FIRST_GAP_DAYS, ...(options.r === undefined ? {} : { fixedR: options.r }) },
  };
}

export const fakeScheduler: Scheduler = {
  retrievability(card, now) {
    if (!card.lastReview) return null;
    if (typeof card.data.fixedR === 'number') return card.data.fixedR;
    const gapDays = typeof card.data.gapDays === 'number' ? card.data.gapDays : FIRST_GAP_DAYS;
    const elapsedDays = (now.getTime() - instantFromIso(card.lastReview).getTime()) / MS_PER_DAY;
    return Math.pow(0.85, elapsedDays / gapDays);
  },

  rate(card, know, now) {
    const previous = card && typeof card.data.gapDays === 'number' && card.lastReview ? card.data.gapDays : null;
    const gapDays = !know ? 1 : previous === null ? FIRST_GAP_DAYS : previous * GROWTH;
    return {
      due: shiftInstant(now, gapDays * MS_PER_DAY).toISOString(),
      lastReview: now.toISOString(),
      data: { gapDays },
    };
  },

  fresh(due) {
    return { due: due.toISOString(), lastReview: null, data: {} };
  },
};
