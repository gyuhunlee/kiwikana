import type { DayKey } from '../../shared/time/dayKey.logic';
import { tick } from '../bar/day.logic';
import type { Effect, HomeState, Result } from '../home.types';
import { wordOf, type WordState, type Words } from '../words/words.types';

export const RETIRE_AFTER_DAYS = 2;

export interface StrokeSession {
  /** The pool as read when Stroke opened (ST-4). A retired word leaves at the next read, not mid-word. */
  wordIds: string[];
  wordIndex: number;
  charIndex: number;
  /** Day the `traced` map belongs to. */
  day: DayKey;
  /** wordId → character indexes traced today (ST-14). */
  traced: Record<string, number[]>;
  /** ST-30: a word never met on Home, shown once and not in the pool. */
  oneOffWordId: string | null;
}

export interface PoolOptions {
  /** ST-3: onboarding answer was "know kana" or a JLPT level, or all 46 Gojūon hiragana are Good or better. */
  knowsKana: boolean;
  isKanaOnly: (wordId: string) => boolean;
}

const inPool = (word: WordState): boolean => word.metOnHome && !word.strokeRemoved && !word.strokeRetired;

// ST-1, ST-2, ST-3
export function strokePool(words: Words, options: PoolOptions): string[] {
  return Object.values(words)
    .filter(inPool)
    .filter((word) => !(options.knowsKana && options.isKanaOnly(word.wordId)))
    .sort((a, b) => (a.metAt === b.metAt ? (a.wordId < b.wordId ? -1 : 1) : (a.metAt ?? '') > (b.metAt ?? '') ? -1 : 1))
    .map((word) => word.wordId);
}

// ST-4: re-read each time Stroke opens, starting at the first word, first character.
export function openSession(words: Words, options: PoolOptions, today: DayKey, previous?: StrokeSession): StrokeSession {
  return {
    wordIds: strokePool(words, options),
    wordIndex: 0,
    charIndex: 0,
    day: today,
    traced: previous && previous.day === today ? previous.traced : {},
    oneOffWordId: null,
  };
}

// ST-5: null = empty pool → empty state.
export function currentWordId(session: StrokeSession): string | null {
  return session.wordIds[session.wordIndex] ?? null;
}

// ST-31
export function jumpToCharacter(session: StrokeSession, charIndex: number): StrokeSession {
  return { ...session, charIndex };
}

/** » : untraced characters get no credit. Loops to the top at the end (ST-4). */
export function nextWord(session: StrokeSession): StrokeSession {
  const leavingOneOff = currentWordId(session) === session.oneOffWordId && session.oneOffWordId !== null;
  const wordIds = leavingOneOff ? session.wordIds.filter((id) => id !== session.oneOffWordId) : session.wordIds;
  const nextIndex = leavingOneOff ? session.wordIndex : session.wordIndex + 1;
  return {
    ...session,
    wordIds,
    wordIndex: wordIds.length === 0 ? 0 : nextIndex % wordIds.length,
    charIndex: 0,
    oneOffWordId: leavingOneOff ? null : session.oneOffWordId,
  };
}

/** → : next character; at the last one, the next word. */
export function nextCharacter(session: StrokeSession, charCount: number): StrokeSession {
  return session.charIndex + 1 < charCount ? { ...session, charIndex: session.charIndex + 1 } : nextWord(session);
}

function forToday(session: StrokeSession, today: DayKey): StrokeSession {
  return session.day === today ? session : { ...session, day: today, traced: {} };
}

// ST-13, ST-14, ST-32, ST-33. Call when every stroke of the current character has been accepted.
export function characterTraced(
  state: HomeState,
  session: StrokeSession,
  character: string,
  charCount: number,
  today: DayKey,
): Result & { session: StrokeSession } {
  const wordId = currentWordId(session);
  const fresh = forToday(session, today);
  const already = wordId ? (fresh.traced[wordId] ?? []) : [];
  // ST-14: one tick per character per day, however often it is cleared and traced again.
  if (!wordId || already.includes(fresh.charIndex)) return { state, effects: [], session: fresh };

  const tracedIndexes = [...already, fresh.charIndex];
  const nextSession = { ...fresh, traced: { ...fresh.traced, [wordId]: tracedIndexes } };

  const ticked = tick(state, today, { kind: 'traced', id: character });
  let next: HomeState = { ...ticked.state, stats: { ...ticked.state.stats, charactersTraced: ticked.state.stats.charactersTraced + 1 } };
  const effects: Effect[] = [...ticked.effects];

  // ST-35: only the stroke fields of the word change.
  const word = wordOf(next.words, wordId);
  if (tracedIndexes.length >= charCount && word.lastStrokeDay !== today) {
    const strokeDays = word.strokeDays + 1; // ST-32
    const updated: WordState = { ...word, strokeDays, lastStrokeDay: today, strokeRetired: strokeDays >= RETIRE_AFTER_DAYS }; // ST-33
    next = { ...next, words: { ...next.words, [wordId]: updated } };
  }
  return { state: next, effects, session: nextSession };
}

// ST-34: ✕. No tick, not on the summary.
export function removeFromStroke(state: HomeState, session: StrokeSession): Result & { session: StrokeSession } {
  const wordId = currentWordId(session);
  if (!wordId) return { state, effects: [], session };
  const word = wordOf(state.words, wordId);
  const wordIds = session.wordIds.filter((id) => id !== wordId);
  return {
    state: { ...state, words: { ...state.words, [wordId]: { ...word, strokeRemoved: true } } },
    effects: [{ type: 'showUndo' }],
    session: {
      ...session,
      wordIds,
      wordIndex: wordIds.length === 0 ? 0 : session.wordIndex % wordIds.length,
      charIndex: 0,
      oneOffWordId: session.oneOffWordId === wordId ? null : session.oneOffWordId,
    },
  };
}

// ST-30: Practice writing from a word sheet. That word first, then the normal pool.
export function practiceWriting(
  state: HomeState,
  wordId: string,
  options: PoolOptions,
  today: DayKey,
  previous?: StrokeSession,
): { state: HomeState; session: StrokeSession } {
  const word = wordOf(state.words, wordId);
  let next = state;
  if (word.metOnHome && (word.strokeRemoved || word.strokeRetired)) {
    // A removed or retired word goes back in the pool with strokeDays 0.
    const back: WordState = { ...word, strokeRemoved: false, strokeRetired: false, strokeDays: 0, lastStrokeDay: null };
    next = { ...state, words: { ...state.words, [wordId]: back } };
  }
  const session = openSession(next.words, options, today, previous);
  const rest = session.wordIds.filter((id) => id !== wordId);
  return {
    state: next,
    // A word never met on Home gets a one-off visit and does not join the pool.
    session: { ...session, wordIds: [wordId, ...rest], oneOffWordId: word.metOnHome ? null : wordId },
  };
}
