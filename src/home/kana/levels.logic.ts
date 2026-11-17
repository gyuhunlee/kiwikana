import { daysBetween, type DayKey } from '../../shared/time/dayKey.logic';

export interface KanaState {
  /** Never decreases. */
  score: number;
  /** In a checked question at least once, right or wrong. */
  seen: boolean;
  lastDrilled: DayKey | null;
  lastWrong: boolean;
  knownByUser: boolean;
}

export type KanaLevel = 'new' | 'weak' | 'good' | 'excellent';

export const GOOD_SCORE = 4;
export const EXCELLENT_SCORE = 6;
const REFRESH_AFTER_DAYS = 3;

export const newKana: KanaState = { score: 0, seen: false, lastDrilled: null, lastWrong: false, knownByUser: false };

// KN-1, KN-2
export function kanaLevel(kana: KanaState): KanaLevel {
  if (kana.score >= EXCELLENT_SCORE) return 'excellent';
  if (kana.score >= GOOD_SCORE) return 'good';
  return kana.seen ? 'weak' : 'new';
}

// KN-3
export function demand(kana: KanaState, today: DayKey): number {
  const level = kanaLevel(kana);
  if (level === 'new' || level === 'weak') return 3;
  if (level === 'good') return 2;
  const stale = kana.lastDrilled === null || daysBetween(kana.lastDrilled, today) >= REFRESH_AFTER_DAYS;
  return stale ? 1 : 0;
}

// KN-61, DK-62: I know it / I already know this.
export function markKanaKnown(kana: KanaState): KanaState {
  return { ...kana, score: Math.max(kana.score, EXCELLENT_SCORE), seen: true, knownByUser: true };
}

// DK-61
export function progressLine(kana: KanaState): string {
  switch (kanaLevel(kana)) {
    case 'new':
      return 'New';
    case 'weak':
      return `Weak · ${kana.score} / ${GOOD_SCORE} correct to Good`;
    case 'good':
      return `Good · ${kana.score} / ${EXCELLENT_SCORE} correct to Excellent`;
    case 'excellent':
      return 'Excellent';
  }
}

export type KanaStates = Readonly<Record<string, KanaState>>;

export const kanaOf = (states: KanaStates, char: string): KanaState => states[char] ?? newKana;

export interface CheckedQuestion {
  /** The kana the question was built for. */
  target: string;
  /** Every distinct kana in the question (a word question lists all its kana). */
  kana: readonly string[];
  correct: boolean;
}

// KN-63 to KN-66. Levels update live after every Check (KN-4).
export function applyCheck(
  states: KanaStates,
  question: CheckedQuestion,
  today: DayKey,
): { states: Record<string, KanaState>; levelUps: string[] } {
  const next: Record<string, KanaState> = { ...states };
  const levelUps: string[] = [];
  for (const char of new Set([question.target, ...question.kana])) {
    const before = kanaOf(states, char);
    const after: KanaState = {
      ...before,
      score: question.correct ? before.score + 1 : before.score, // KN-63, KN-65
      seen: true, // KN-64
      lastDrilled: today,
      lastWrong: char === question.target ? !question.correct : before.lastWrong,
    };
    next[char] = after;
    const reached = kanaLevel(after);
    if (reached !== kanaLevel(before) && (reached === 'good' || reached === 'excellent')) levelUps.push(char); // KN-66
  }
  return { states: next, levelUps };
}
