import { dayCounts, type Days } from '../home/bar/streak.logic';
import { kanaLevel, type KanaStates } from '../home/kana/levels.logic';
import { deckById, isDeckComplete } from '../home/words/deck-advance.logic';
import { wordOf, type Words } from '../home/words/words.types';
import type { Deck } from '../shared/content/types';
import { addDays, dayKeyOf, weekdayIndex, type DayKey } from '../shared/time/dayKey.logic';
import { instantFromIso } from '../shared/time/zone.logic';

// Everything here is derived from stored state. Nothing is cached (docs/specs/profile-settings.md).

export interface WeekBar {
  dayKey: DayKey;
  ticks: number;
  /** Dark when round 1 was done or the day was repaired. */
  done: boolean;
  future: boolean;
}

// PF-2. `weekStartsOn`: 0 = Sunday, 1 = Monday (device locale).
export function weekBars(days: Days, today: DayKey, weekStartsOn: 0 | 1 = 1): WeekBar[] {
  const start = addDays(today, -((weekdayIndex(today) - weekStartsOn + 7) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const key = addDays(start, index);
    return { dayKey: key, ticks: days[key]?.ticks ?? 0, done: dayCounts(days[key]), future: key > today };
  });
}

// PF-3: mean over this week's days so far, today included. null hides the line (day 1, nothing done).
export function weekAverage(bars: readonly WeekBar[]): { value: number; text: string } | null {
  const soFar = bars.filter((bar) => !bar.future);
  const total = soFar.reduce((sum, bar) => sum + bar.ticks, 0);
  if (soFar.length === 0 || total === 0) return null;
  const value = Math.round(total / soFar.length);
  return { value, text: `${value} a day` };
}

// PF-4
export function wordsMet(words: Words, today: DayKey, timeZone: string): { total: number; today: number } {
  const met = Object.values(words).filter((word) => word.status !== 'new');
  const metToday = met.filter((word) => word.metAt !== null && dayKeyOf(instantFromIso(word.metAt), timeZone) === today);
  return { total: met.length, today: metToday.length };
}

// PF-5
export function wordsKnown(words: Words): number {
  return Object.values(words).filter((word) => word.status === 'known').length;
}

export const MILESTONE_STEP = 50;

// PF-6: at 120 met, 20 / 50 toward 150.
export function milestone(met: number): { done: number; step: number; target: number } {
  return { done: met % MILESTONE_STEP, step: MILESTONE_STEP, target: (Math.floor(met / MILESTONE_STEP) + 1) * MILESTONE_STEP };
}

// PF-7
export function upNext(
  decks: readonly Deck[],
  currentDeckId: string | null,
  words: Words,
  hasNextDeck: boolean,
): { met: number; size: number; text: string } | null {
  const deck = deckById(decks, currentDeckId);
  if (!deck) return null;
  const met = deck.wordIds.filter((wordId) => wordOf(words, wordId).status !== 'new').length;
  const left = deck.wordIds.length - met;
  const text = left === 0 && !hasNextDeck ? 'Deck finished' : `${left} words to finish this deck`;
  return { met, size: deck.wordIds.length, text };
}

// PF-8
export function decksCompleted(decks: readonly Deck[], words: Words): number {
  return decks.filter((deck) => isDeckComplete(deck, words)).length;
}

export interface GradedAnswer {
  dayKey: DayKey;
  correct: boolean;
}

// PF-10: word quizzes + kana questions in the current week. No graded answers → "–".
export function weekAccuracy(graded: readonly GradedAnswer[], bars: readonly WeekBar[]): string {
  const first = bars[0]?.dayKey ?? '';
  const last = bars.at(-1)?.dayKey ?? '';
  const thisWeek = graded.filter((answer) => answer.dayKey >= first && answer.dayKey <= last);
  if (thisWeek.length === 0) return '–';
  return `${Math.round((thisWeek.filter((answer) => answer.correct).length / thisWeek.length) * 100)}%`;
}

// PF-11: Good or Excellent, both scripts.
export function kanaLearned(scripts: readonly KanaStates[]): number {
  return scripts
    .flatMap((states) => Object.values(states))
    .filter((kana) => ['good', 'excellent'].includes(kanaLevel(kana))).length;
}
