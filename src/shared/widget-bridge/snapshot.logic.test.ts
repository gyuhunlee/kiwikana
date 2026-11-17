import { describe, expect, it } from 'vitest';
import type { Ctx, HomeState } from '../../home/home.types';
import { answerQuiz } from '../../home/words/answer.logic';
import { ensurePack } from '../../home/words/pack.logic';
import type { Sentence, Word } from '../content/types';
import { fakeClock, type FakeClock } from '../testing/fakeClock';
import { fakeScheduler } from '../testing/fakeScheduler';
import { fixtureContent } from '../testing/fixtures';
import { scenario } from '../testing/scenarios';
import { addDays, dayKey } from '../time/dayKey.logic';
import { formatLocal, fromLocal, instantFromIso } from '../time/zone.logic';
import {
  DEFAULT_WIDGET_SETTINGS,
  buildSnapshot,
  changeMinutes,
  currentWord,
  entriesFor,
  notificationsFor,
  packWordIds,
  rotationCount,
  shownIndex,
  snapshotWordIds,
  stepManually,
  wordIndexAt,
  type Snapshot,
  type WidgetContent,
} from './snapshot.logic';

const zone = 'America/Los_Angeles';
const content = fixtureContent();
const ctxOf = (clock: FakeClock): Ctx => ({ clock, scheduler: fakeScheduler, content });
const open = (state: HomeState, clock: FakeClock): HomeState => ensurePack(state, dayKey(clock), ctxOf(clock));

const widgetContent: WidgetContent = (() => {
  const words: Record<string, Word> = {};
  const sentences: Record<string, Sentence> = {};
  for (const deck of content.decks) {
    deck.wordIds.forEach((id, index) => {
      words[id] = {
        id, kanji: `字${id}`, kana: `かな${id}`, romaji: `romaji-${id}`, meaning: `meaning of ${id}`, level: 'N5',
        deckId: deck.id, order: index, pictureAnime: `${id}-anime.jpg`, pictureRealistic: `${id}-real.jpg`,
        audio: `${id}.m4a`, sentenceIds: [`${id}-s1`, `${id}-s2`],
      };
      sentences[`${id}-s1`] = {
        id: `${id}-s1`, wordId: id, translation: 'It is raining.', targetSpan: [6, 13], audio: `${id}-s1.m4a`,
        tokens: [
          { surface: '雨', furigana: [{ start: 0, end: 1, reading: 'あめ' }], dictionaryForm: '雨', romaji: 'ame', wordId: id, isParticle: false, isTarget: true },
          { surface: 'が', dictionaryForm: 'が', romaji: 'ga', isParticle: true, isTarget: false },
          { surface: '降って', furigana: [{ start: 0, end: 1, reading: 'ふ' }], dictionaryForm: '降る', romaji: 'futte', isParticle: false, isTarget: false },
        ],
      };
    });
  }
  return { words, sentences };
})();

const snapshotOf = (wordCounts: number[], settings = DEFAULT_WIDGET_SETTINGS, firstDay = '2026-11-16'): Snapshot => ({
  version: 1,
  writtenAt: '',
  ...settings,
  days: wordCounts.map((count, dayIndex) => ({
    dayKey: addDays(firstDay, dayIndex),
    words: Array.from({ length: count }, (_, index) => ({
      id: `d${dayIndex}w${index}`, word: `語${index}`, reading: `よみ${index}`, romaji: `yomi${index}`, meaning: `meaning ${index}`,
      sentence: null, picture: '', wordAudio: '', sentenceAudio: null,
    })),
  })),
});
const at = (local: string) => fromLocal(local, zone);
const noQuiet = { ...DEFAULT_WIDGET_SETTINGS, quietStart: 0, quietEnd: 0 };

describe('snapshot content', () => {
  it('WG-5 today = the pack’s new words first, then its learning words, no duplicates, never Known', () => {
    const clock = fakeClock();
    const s = open(scenario.fresh(clock).withLearning(['core1-19', 'core1-20'], { r: 0.9 }).build(), clock);
    expect(packWordIds(s.pack, s.words)).toEqual(['core1-01', 'core1-02', 'core1-03', 'core1-04', 'core1-19', 'core1-20']);
  });

  it('WG-5 WG-7 a word that turns Known drops out of today on the next rebuild', () => {
    const clock = fakeClock();
    const s = open(scenario.twoDotsDue(clock).build(), clock);
    expect(snapshotWordIds(s, ctxOf(clock))[0]?.wordIds).toContain('core1-01');
    const after = answerQuiz(s, true, ctxOf(clock));
    expect(after.effects.map((effect) => effect.type)).toContain('reloadWidgets');
    expect(snapshotWordIds(after.state, ctxOf(clock))[0]?.wordIds).not.toContain('core1-01');
  });

  it('WG-4 days = today plus the next 7, later days previewed with buildPack on current state', () => {
    const clock = fakeClock();
    const s = open(scenario.fresh(clock).withLearning(['core1-20'], { dueInDays: 3, r: 0.9 }).build(), clock);
    const days = snapshotWordIds(s, ctxOf(clock));
    expect(days.map((day) => day.dayKey)).toEqual(Array.from({ length: 8 }, (_, i) => addDays(dayKey(clock), i)));
    expect(days[0]?.wordIds).not.toContain('core1-20');
    expect(days[2]?.wordIds).not.toContain('core1-20');
    expect(days[3]?.wordIds).toContain('core1-20');
  });

  it('WG-6 a day with no words has an empty list', () => {
    const clock = fakeClock();
    const snapshot = buildSnapshot(scenario.allKnown(clock).build(), ctxOf(clock), DEFAULT_WIDGET_SETTINGS, widgetContent);
    expect(snapshot.days).toHaveLength(8);
    expect(snapshot.days.every((day) => day.words.length === 0)).toBe(true);
    expect(currentWord(snapshot, clock.now(), zone)).toBeNull();
  });

  it('WG-8 only the current picture style is written', () => {
    const clock = fakeClock();
    const s = open(scenario.fresh(clock).build(), clock);
    const anime = buildSnapshot(s, ctxOf(clock), DEFAULT_WIDGET_SETTINGS, widgetContent);
    const real = buildSnapshot(s, ctxOf(clock), { ...DEFAULT_WIDGET_SETTINGS, pictureStyle: 'realistic' }, widgetContent);
    expect(anime.days[0]?.words[0]?.picture).toBe('core1-01-anime.jpg');
    expect(real.days[0]?.words[0]?.picture).toBe('core1-01-real.jpg');
    expect(anime.days[0]?.words[0]?.sentence).toEqual({
      text: '雨が降って',
      furigana: [{ start: 0, end: 1, reading: 'あめ' }, { start: 2, end: 3, reading: 'ふ' }],
      romaji: 'ame ga futte',
      translation: 'It is raining.',
    });
  });

  it('WG-9 with no change in between, tomorrow’s real pack has the words the preview showed', () => {
    const clock = fakeClock();
    const s = scenario.day6(clock).build();
    const preview = snapshotWordIds(s, ctxOf(clock))[1];
    clock.advanceDays(1);
    const real = open({ ...s, pack: null }, clock);
    expect(packWordIds(real.pack, real.words)).toEqual(preview?.wordIds);
  });
});

describe('rotation', () => {
  it('WG-10 plain day, no quiet hours: one step per interval since 4 AM, wrapping', () => {
    expect([0, 59, 60, 125, 180, 300].map((m) => wordIndexAt(m, noQuiet, 3))).toEqual([0, 0, 1, 2, 0, 2]);
    expect(wordIndexAt(60, { ...noQuiet, intervalMin: 30 }, 5)).toBe(2);
  });

  it('WG-10 WG-11 quiet hours covering the 4 AM start: the first word stays until quiet hours end', () => {
    // Default quiet 22:00–07:00. 4 AM = minute 0, 7 AM = minute 180, 22:00 = minute 1080.
    expect([0, 60, 179, 180, 240].map((m) => wordIndexAt(m, DEFAULT_WIDGET_SETTINGS, 10))).toEqual([0, 0, 0, 1, 2]);
  });

  it('WG-11 quiet hours crossing midnight: the last word before them stays all night', () => {
    const lastChange = rotationCount(1079, DEFAULT_WIDGET_SETTINGS);
    expect(lastChange).toBe(15); // 07:00 … 21:00
    expect([1080, 1200, 1439].map((m) => rotationCount(m, DEFAULT_WIDGET_SETTINGS))).toEqual([15, 15, 15]);
  });

  it('WG-10 1 word, 0 words, and an interval longer than the awake window', () => {
    expect(wordIndexAt(600, noQuiet, 1)).toBe(0);
    expect(wordIndexAt(600, noQuiet, 0)).toBe(0);
    // Awake 07:00–08:00 only, 4-hour interval: changes would fall at 08:00, 12:00 … all quiet except none inside.
    const tight = { intervalMin: 240, quietStart: 8 * 60, quietEnd: 7 * 60 };
    expect(changeMinutes(tight)).toEqual([]);
    expect(wordIndexAt(1000, tight, 5)).toBe(0);
  });

  it('WG-12 at 4 AM the widget switches to the next day’s words', () => {
    const snapshot = snapshotOf([3, 3], noQuiet);
    expect(currentWord(snapshot, at('2026-11-17T03:59'), zone)?.id).toBe('d0w2');
    expect(currentWord(snapshot, at('2026-11-17T04:00'), zone)?.id).toBe('d1w0');
  });

  it('WG-13 defaults: 1 hour, quiet 22:00–07:00', () => {
    expect(DEFAULT_WIDGET_SETTINGS).toEqual({ intervalMin: 60, quietStart: 1320, quietEnd: 420, pictureStyle: 'anime' });
  });

  it('WG-14 past the end of the snapshot the last day keeps cycling', () => {
    const snapshot = snapshotOf([2, 4], noQuiet);
    expect(currentWord(snapshot, at('2026-11-30T05:00'), zone)?.id).toBe('d1w1');
  });

  it('WG-14 WG-15 entries for 24 hours: one at the start, one per change, same word for every widget', () => {
    const snapshot = snapshotOf([3, 3]);
    const from = at('2026-11-16T09:30');
    const entries = entriesFor(snapshot, from, at('2026-11-17T09:30'), zone);
    const local = entries.map((entry) => `${formatLocal(instantFromIso(entry.at), zone).slice(11)} ${entry.wordId}`);
    // 07:00 → 1, 08:00 → 2, 09:00 → 3 (index 0). Then hourly to 21:00, quiet, 04:00 next day, 07:00 …
    expect(local.slice(0, 3)).toEqual(['09:30 d0w0', '10:00 d0w1', '11:00 d0w2']);
    expect(local.slice(-4)).toEqual(['04:00 d1w0', '07:00 d1w1', '08:00 d1w2', '09:00 d1w0']);
    expect(local).toHaveLength(1 + 12 + 4);
    expect(entries[0]?.wordId).toBe(currentWord(snapshot, from, zone)?.id);
  });

  it('WG-21 arrows step through today’s words, wrap, and reset at the next rotation change', () => {
    const count = rotationCount(400, noQuiet);
    const back = stepManually(0, -1, 4, count);
    expect(back.index).toBe(3);
    expect(stepManually(3, 1, 4, count).index).toBe(0);
    expect(shownIndex(2, back, count)).toBe(3);
    expect(shownIndex(2, back, count + 1)).toBe(2);
    expect(shownIndex(2, null, count)).toBe(2);
  });
});

describe('notifications', () => {
  it('WG-30 one per change, title reading · word · romaji, body meaning, 48 at most', () => {
    const notifications = notificationsFor(snapshotOf([3, 3, 3, 3, 3], noQuiet), at('2026-11-16T09:30'), zone);
    expect(notifications).toHaveLength(48);
    expect(notifications[0]).toEqual({ at: at('2026-11-16T10:00').toISOString(), title: 'よみ0 · 語0 · yomi0', body: 'meaning 0' });
  });

  it('WG-32 none in quiet hours and none for a day with no words', () => {
    const notifications = notificationsFor(snapshotOf([3, 0, 3]), at('2026-11-16T20:30'), zone);
    const times = notifications.map((n) => formatLocal(instantFromIso(n.at), zone));
    expect(times.slice(0, 2)).toEqual(['2026-11-16 21:00', '2026-11-18 07:00']);
  });
});
