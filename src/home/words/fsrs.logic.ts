import { createEmptyCard, fsrs, generatorParameters, Rating, type Card as TsFsrsCard } from 'ts-fsrs';
import { instantFromIso } from '../../shared/time/zone.logic';
import { RETENTION, type FsrsCard, type Scheduler } from './words.types';

// The only file that imports ts-fsrs (docs/architecture.md).
// WF-1: default weights, desired retention 0.85, no fuzz so the same answers give the same dates.
const engine = fsrs(generatorParameters({ request_retention: RETENTION, enable_fuzz: false }));

function toLibrary(card: FsrsCard): TsFsrsCard {
  return {
    ...card.data,
    due: instantFromIso(card.due),
    last_review: card.lastReview ? instantFromIso(card.lastReview) : undefined,
  } as TsFsrsCard;
}

function fromLibrary(card: TsFsrsCard): FsrsCard {
  const { due, last_review: lastReview, ...data } = card;
  return { due: due.toISOString(), lastReview: lastReview ? lastReview.toISOString() : null, data };
}

export const fsrsScheduler: Scheduler = {
  // WF-2: a word with no FSRS review yet has no retrievability.
  retrievability(card, now) {
    if (!card.lastReview) return null;
    return engine.get_retrievability(toLibrary(card), now, false);
  },

  // WF-1: Good (Know) and Again (Don't know) only.
  rate(card, know, now) {
    const current = card ? toLibrary(card) : createEmptyCard(now);
    return fromLibrary(engine.next(current, now, know ? Rating.Good : Rating.Again).card);
  },

  fresh(due) {
    return fromLibrary(createEmptyCard(due));
  },
};
