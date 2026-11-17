import type { Ctx, HomeState } from '../../home/home.types';
import { buildPack } from '../../home/words/pack.logic';
import { wordOf, type Pack, type Words } from '../../home/words/words.types';
import type { FuriganaRun, Sentence, Word } from '../content/types';
import type { Clock } from '../time/clock';
import { MS_PER_DAY, addDays, dayKey, dayKeyOf, type DayKey } from '../time/dayKey.logic';
import { fromLocal, instantFromIso, localParts, shiftInstant } from '../time/zone.logic';

// All rules about which word shows when live here, so Swift only reads (docs/specs/widgets.md).

export const SNAPSHOT_VERSION = 1;
export const PREVIEW_DAYS = 7;
const MINUTES_PER_DAY = 1440;
const DAY_START_MINUTE = 4 * 60;
const MS_PER_MINUTE = 60_000;

export interface WidgetSettings {
  /** WG-13 (placeholder choices): 15, 30, 60, 120, 240. Default 60. */
  intervalMin: number;
  /** Minutes after midnight. Default 22:00–07:00. May cross midnight. */
  quietStart: number;
  quietEnd: number;
  pictureStyle: 'anime' | 'realistic';
}

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  intervalMin: 60,
  quietStart: 22 * 60,
  quietEnd: 7 * 60,
  pictureStyle: 'anime',
};

export interface SnapshotWord {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meaning: string;
  sentence: { text: string; furigana: FuriganaRun[]; romaji: string; translation: string } | null;
  picture: string;
  wordAudio: string;
  sentenceAudio: string | null;
}

export interface SnapshotDay {
  dayKey: DayKey;
  words: SnapshotWord[];
}

export interface Snapshot extends WidgetSettings {
  version: number;
  writtenAt: string;
  days: SnapshotDay[];
}

export interface WidgetContent {
  words: Readonly<Record<string, Word>>;
  sentences: Readonly<Record<string, Sentence>>;
}

// WG-5: new words first (deck order), then learning words in pack order. No duplicates, never Known.
export function packWordIds(pack: Pack | null, words: Words): string[] {
  if (!pack) return [];
  const fresh = pack.cards.filter((card) => card.type === 'new').map((card) => card.wordId);
  const rest = pack.cards.filter((card) => card.type !== 'new').map((card) => card.wordId);
  return [...new Set([...fresh, ...rest])].filter((wordId) => wordOf(words, wordId).status !== 'known');
}

// WG-4 (default NQ-5): today from the saved pack, then 7 preview days built on current state.
export function snapshotWordIds(state: HomeState, ctx: Ctx): { dayKey: DayKey; wordIds: string[] }[] {
  const today = dayKey(ctx.clock);
  const todaysPack = state.pack?.dayKey === today ? state.pack : buildPack({ ...state, pack: null }, today, 1, ctx).pack;
  const days = [{ dayKey: today, wordIds: packWordIds(todaysPack, state.words) }];

  for (let ahead = 1; ahead <= PREVIEW_DAYS; ahead += 1) {
    const later: Clock = {
      now: () => shiftInstant(ctx.clock.now(), ahead * MS_PER_DAY),
      timeZone: () => ctx.clock.timeZone(),
    };
    const key = addDays(today, ahead);
    // WG-9: the same function the app runs on that day, so an unchanged state gives the same words.
    const preview = buildPack({ ...state, pack: null }, key, 1, { ...ctx, clock: later });
    days.push({ dayKey: key, wordIds: packWordIds(preview.pack, state.words) });
  }
  return days;
}

function sentenceOf(word: Word, content: WidgetContent): SnapshotWord['sentence'] {
  const sentence = content.sentences[word.sentenceIds[0]];
  if (!sentence) return null;
  let offset = 0;
  const furigana: FuriganaRun[] = [];
  for (const token of sentence.tokens) {
    for (const run of token.furigana ?? []) {
      furigana.push({ start: offset + run.start, end: offset + run.end, reading: run.reading });
    }
    offset += token.surface.length;
  }
  return {
    text: sentence.tokens.map((token) => token.surface).join(''),
    furigana,
    romaji: sentence.tokens.map((token) => token.romaji).filter(Boolean).join(' '),
    translation: sentence.translation,
  };
}

export function buildSnapshot(state: HomeState, ctx: Ctx, settings: WidgetSettings, content: WidgetContent): Snapshot {
  const toWord = (wordId: string): SnapshotWord[] => {
    const word = content.words[wordId];
    if (!word) return [];
    return [
      {
        id: word.id,
        word: word.kanji || word.kana,
        reading: word.kana,
        romaji: word.romaji,
        meaning: word.meaning,
        sentence: sentenceOf(word, content),
        picture: settings.pictureStyle === 'anime' ? word.pictureAnime : word.pictureRealistic, // WG-8
        wordAudio: word.audio,
        sentenceAudio: content.sentences[word.sentenceIds[0]]?.audio ?? null,
      },
    ];
  };
  return {
    version: SNAPSHOT_VERSION,
    writtenAt: ctx.clock.now().toISOString(),
    ...settings,
    // WG-6: a day with no words keeps an empty list; the widget shows "All caught up".
    days: snapshotWordIds(state, ctx).map((day) => ({ dayKey: day.dayKey, words: day.wordIds.flatMap(toWord) })),
  };
}

// --- Rotation. Swift mirrors exactly this. ---

type Rotation = Pick<WidgetSettings, 'intervalMin' | 'quietStart' | 'quietEnd'>;

export function isQuiet(minuteOfDay: number, rotation: Rotation): boolean {
  const { quietStart, quietEnd } = rotation;
  if (quietStart === quietEnd) return false;
  if (quietStart < quietEnd) return minuteOfDay >= quietStart && minuteOfDay < quietEnd;
  return minuteOfDay >= quietStart || minuteOfDay < quietEnd; // crosses midnight
}

/** Minutes since the day's 4 AM start at which the word changes (WG-10, WG-11). */
export function changeMinutes(rotation: Rotation): number[] {
  const changes: number[] = [];
  for (let minute = rotation.intervalMin; minute < MINUTES_PER_DAY; minute += rotation.intervalMin) {
    if (!isQuiet((DAY_START_MINUTE + minute) % MINUTES_PER_DAY, rotation)) changes.push(minute);
  }
  return changes;
}

/** How many times the word has changed since 4 AM. Also the "tick" a manual step is tied to (WG-21). */
export function rotationCount(minutesIntoDay: number, rotation: Rotation): number {
  return changeMinutes(rotation).filter((minute) => minute <= minutesIntoDay).length;
}

// WG-10
export function wordIndexAt(minutesIntoDay: number, rotation: Rotation, wordCount: number): number {
  return wordCount === 0 ? 0 : rotationCount(minutesIntoDay, rotation) % wordCount;
}

export function minutesIntoDay(instant: Date, timeZone: string): number {
  const parts = localParts(instant, timeZone);
  return (parts.hour * 60 + parts.minute - DAY_START_MINUTE + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

// WG-14: past the end of the snapshot, keep cycling its last day.
export function dayFor(snapshot: Snapshot, key: DayKey): SnapshotDay | null {
  return snapshot.days.find((day) => day.dayKey === key) ?? snapshot.days.at(-1) ?? null;
}

// WG-12, WG-15: every widget kind asks this, so they all show the same word.
export function currentWord(snapshot: Snapshot, now: Date, timeZone: string): SnapshotWord | null {
  const day = dayFor(snapshot, dayKeyOf(now, timeZone));
  if (!day || day.words.length === 0) return null;
  return day.words[wordIndexAt(minutesIntoDay(now, timeZone), snapshot, day.words.length)] ?? null;
}

export interface TimelineEntry {
  at: string;
  dayKey: DayKey;
  index: number;
  wordId: string | null;
}

function dayStart(key: DayKey, timeZone: string): Date {
  return fromLocal(`${key}T04:00`, timeZone);
}

/** One entry at `from`, then one at every change up to `to`. */
export function entriesFor(snapshot: Snapshot, from: Date, to: Date, timeZone: string): TimelineEntry[] {
  const entryAt = (at: Date, key: DayKey, minutes: number): TimelineEntry => {
    const words = dayFor(snapshot, key)?.words ?? [];
    const index = wordIndexAt(minutes, snapshot, words.length);
    return { at: at.toISOString(), dayKey: key, index, wordId: words[index]?.id ?? null };
  };

  const entries = [entryAt(from, dayKeyOf(from, timeZone), minutesIntoDay(from, timeZone))];
  for (let key = dayKeyOf(from, timeZone); key <= dayKeyOf(to, timeZone); key = addDays(key, 1)) {
    const start = dayStart(key, timeZone);
    for (const minute of [0, ...changeMinutes(snapshot)]) {
      const at = shiftInstant(start, minute * MS_PER_MINUTE);
      if (at.getTime() > from.getTime() && at.getTime() <= to.getTime()) entries.push(entryAt(at, key, minute));
    }
  }
  return entries;
}

// WG-21: ‹ › step through today's words, wrapping. The step lasts until the next rotation change.
export interface ManualStep {
  index: number;
  rotationCount: number;
}

export function stepManually(shownIndex: number, delta: 1 | -1, wordCount: number, count: number): ManualStep {
  return { index: (shownIndex + delta + wordCount) % wordCount, rotationCount: count };
}

export function shownIndex(rotationIndex: number, manual: ManualStep | null, count: number): number {
  return manual && manual.rotationCount === count ? manual.index : rotationIndex;
}

export interface WidgetNotification {
  at: string;
  title: string;
  body: string;
}

export const NOTIFICATION_SLOTS = 48;

// WG-30 (defaults NQ-6, NQ-18), WG-32: one per change outside quiet hours, none for a day with no words.
export function notificationsFor(snapshot: Snapshot, from: Date, timeZone: string): WidgetNotification[] {
  const horizon = shiftInstant(from, (PREVIEW_DAYS + 1) * MS_PER_DAY);
  const notifications: WidgetNotification[] = [];
  for (const entry of entriesFor(snapshot, from, horizon, timeZone).slice(1)) {
    if (notifications.length === NOTIFICATION_SLOTS) break;
    const word = dayFor(snapshot, entry.dayKey)?.words[entry.index];
    const minuteOfDay = (minutesIntoDay(instantFromIso(entry.at), timeZone) + DAY_START_MINUTE) % MINUTES_PER_DAY;
    if (!word || isQuiet(minuteOfDay, snapshot)) continue;
    notifications.push({ at: entry.at, title: `${word.reading} · ${word.word} · ${word.romaji}`, body: word.meaning });
  }
  return notifications;
}
