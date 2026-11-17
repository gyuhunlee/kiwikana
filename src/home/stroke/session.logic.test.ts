import { describe, expect, it } from 'vitest';
import { fakeClock } from '../../shared/testing/fakeClock';
import { scenario } from '../../shared/testing/scenarios';
import { addDays } from '../../shared/time/dayKey.logic';
import { barText, dayOf } from '../bar/day.logic';
import type { HomeState } from '../home.types';
import { wordOf, type WordState } from '../words/words.types';
import {
  characterTraced,
  currentWordId,
  jumpToCharacter,
  nextCharacter,
  nextWord,
  openSession,
  practiceWriting,
  removeFromStroke,
  strokePool,
  type PoolOptions,
} from './session.logic';

const options: PoolOptions = { knowsKana: false, isKanaOnly: (wordId) => wordId === 'kana-only' };
const patch = (state: HomeState, wordId: string, change: Partial<WordState>): HomeState => ({
  ...state,
  words: { ...state.words, [wordId]: { ...wordOf(state.words, wordId), ...change } },
});

/** 3 words met on Home on different days; `a` most recent. One word only marked in Decks. */
function strokePoolScenario() {
  const clock = fakeClock();
  const base = scenario
    .fresh(clock)
    .withLearning(['c'], { metDaysAgo: 3 })
    .withLearning(['a'], { metDaysAgo: 1 })
    .withLearning(['b'], { metDaysAgo: 2 })
    .withLearning(['kana-only'], { metDaysAgo: 4 })
    .build();
  const state = patch(base, 'decks-only', { status: 'known', metOnHome: false, metAt: clock.now().toISOString() });
  return { state, today: base.today };
}

describe('stroke pool', () => {
  it('ST-1 ST-2 pool = met on Home, not removed, not retired; most recently met first', () => {
    const { state } = strokePoolScenario();
    expect(strokePool(state.words, options)).toEqual(['a', 'b', 'c', 'kana-only']);
    const removed = patch(patch(state, 'a', { strokeRemoved: true }), 'b', { strokeRetired: true });
    expect(strokePool(removed.words, options)).toEqual(['c', 'kana-only']);
  });

  it('ST-3 kana-only words are skipped once the user knows kana', () => {
    const { state } = strokePoolScenario();
    expect(strokePool(state.words, { ...options, knowsKana: true })).toEqual(['a', 'b', 'c']);
  });

  it('ST-4 opens on the first word, first character, and loops at the end', () => {
    const { state, today } = strokePoolScenario();
    let session = openSession(state.words, options, today);
    expect([currentWordId(session), session.charIndex]).toEqual(['a', 0]);
    for (let i = 0; i < 4; i += 1) session = nextWord(session);
    expect(currentWordId(session)).toBe('a');
  });

  it('ST-5 an empty pool has no current word', () => {
    expect(currentWordId(openSession(scenario.fresh().build().words, options, '2026-11-16'))).toBeNull();
  });
});

describe('stroke session', () => {
  it('ST-13 a traced character ticks the bar and adds to characters traced', () => {
    const { state, today } = strokePoolScenario();
    const session = openSession(state.words, options, today);
    const result = characterTraced(state, session, '水', 2, today);
    expect(dayOf(result.state, today).log).toEqual([{ kind: 'traced', id: '水' }]);
    expect(result.state.stats.charactersTraced).toBe(1);
    expect(barText(dayOf(result.state, today))).toBe('1 / 10');
  });

  it('ST-14 one tick per character per day: re-tracing or coming back gives nothing more', () => {
    const { state, today } = strokePoolScenario();
    const first = characterTraced(state, openSession(state.words, options, today), '水', 2, today);
    const again = characterTraced(first.state, first.session, '水', 2, today);
    expect(again.state).toBe(first.state);
    const back = jumpToCharacter(nextCharacter(first.session, 2), 0);
    expect(characterTraced(first.state, back, '水', 2, today).state).toBe(first.state);
    // Re-opening Stroke the same day keeps what was traced.
    const reopened = openSession(first.state.words, options, today, first.session);
    expect(characterTraced(first.state, reopened, '水', 2, today).state).toBe(first.state);
  });

  it('ST-31 → goes to the next character, then the next word; » skips to the next word', () => {
    const { state, today } = strokePoolScenario();
    let session = openSession(state.words, options, today);
    session = nextCharacter(session, 2);
    expect([currentWordId(session), session.charIndex]).toEqual(['a', 1]);
    session = nextCharacter(session, 2);
    expect([currentWordId(session), session.charIndex]).toEqual(['b', 0]);
    session = nextWord(jumpToCharacter(session, 1));
    expect([currentWordId(session), session.charIndex]).toEqual(['c', 0]);
  });

  it('ST-32 a stroke day counts when every character was traced today, once a day', () => {
    const { state, today } = strokePoolScenario();
    const session = openSession(state.words, options, today);
    const first = characterTraced(state, session, '食', 2, today);
    expect(wordOf(first.state.words, 'a').strokeDays).toBe(0);
    const second = characterTraced(first.state, nextCharacter(first.session, 2), 'べ', 2, today);
    expect([wordOf(second.state.words, 'a').strokeDays, wordOf(second.state.words, 'a').lastStrokeDay]).toEqual([1, today]);
  });

  it('ST-33 two stroke days retire the word; it leaves at the next pool read and stays in Words', () => {
    const { state, today } = strokePoolScenario();
    const dayOne = characterTraced(state, openSession(state.words, options, today), '水', 1, today);
    const tomorrow = addDays(today, 1);
    const reopened = openSession(dayOne.state.words, options, tomorrow, dayOne.session);
    const dayTwo = characterTraced(dayOne.state, reopened, '水', 1, tomorrow);
    const word = wordOf(dayTwo.state.words, 'a');
    expect([word.strokeDays, word.strokeRetired, word.status]).toEqual([2, true, 'learning']);
    expect(currentWordId(dayTwo.session)).toBe('a');
    expect(strokePool(dayTwo.state.words, options)).toEqual(['b', 'c', 'kana-only']);
  });

  it('ST-34 ✕ removes the word, loads the next, shows Undo, no tick', () => {
    const { state, today } = strokePoolScenario();
    const result = removeFromStroke(state, openSession(state.words, options, today));
    expect(wordOf(result.state.words, 'a').strokeRemoved).toBe(true);
    expect(currentWordId(result.session)).toBe('b');
    expect(result.effects).toEqual([{ type: 'showUndo' }]);
    expect(dayOf(result.state, today).ticks).toBe(0);
  });

  it('ST-35 ST-36 tracing never changes status, dots, FSRS, deck progress or the pack', () => {
    const { state, today } = strokePoolScenario();
    const result = characterTraced(state, openSession(state.words, options, today), 'べ', 1, today);
    const strip = (word: WordState) => ({ ...word, strokeDays: 0, lastStrokeDay: null, strokeRetired: false });
    expect(strip(wordOf(result.state.words, 'a'))).toEqual(strip(wordOf(state.words, 'a')));
    expect([result.state.deck, result.state.pack, result.state.rewardQueue]).toEqual([state.deck, state.pack, state.rewardQueue]);
  });

  it('ST-30 Practice writing: that word first; removed or retired words rejoin with 0 days; a word not met on Home is a one-off', () => {
    const { state, today } = strokePoolScenario();
    const retired = patch(state, 'c', { strokeRetired: true, strokeDays: 2 });
    const started = practiceWriting(retired, 'c', options, today);
    expect(started.session.wordIds).toEqual(['c', 'a', 'b', 'kana-only']);
    expect([wordOf(started.state.words, 'c').strokeRetired, wordOf(started.state.words, 'c').strokeDays]).toEqual([false, 0]);

    const oneOff = practiceWriting(state, 'decks-only', options, today);
    expect(currentWordId(oneOff.session)).toBe('decks-only');
    expect(wordOf(oneOff.state.words, 'decks-only').metOnHome).toBe(false);
    const moved = nextWord(oneOff.session);
    expect(moved.wordIds).toEqual(['a', 'b', 'c', 'kana-only']);
    expect(currentWordId(moved)).toBe('a');
  });
});
