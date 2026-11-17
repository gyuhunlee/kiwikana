import type { DayState } from '../../home/bar/day.types';
import type { HomeState } from '../../home/home.types';
import type { RewardCard } from '../../home/rewards/reward.types';
import type { FsrsCard, Pack, WordState } from '../../home/words/words.types';
import type { Level } from '../content/types';
import type { ScenarioState } from '../testing/scenarios';
import type { DayKey } from '../time/dayKey.logic';
import type { Db } from './db';
import { getSetting, setSetting } from './settingsRepo';

const USER_TABLES = [
  'word_state',
  'day_state',
  'pack',
  'kana_state',
  'kana_progress',
  'stroke_state',
  'reward_queue',
  'deck_state',
  'stats',
  'graded_log',
  'undo',
] as const;

const flag = (value: boolean): number => (value ? 1 : 0);

interface DayRow {
  dayKey: string;
  ticks: number;
  roundNo: number;
  roundStart: number;
  roundExtra: number;
  goalDone: number;
  repaired: number;
  repairDay: string | null;
  repairRoundNo: number | null;
  log: string;
}

interface WordRow {
  wordId: string;
  status: WordState['status'];
  fsrs: string | null;
  dots: number;
  lastDotDay: string | null;
  lastRatedDay: string | null;
  metAt: string | null;
  metOnHome: number;
  sentenceIndex: number;
  strokeDays: number;
  lastStrokeDay: string | null;
  strokeRemoved: number;
  strokeRetired: number;
}

function dayFromRow(row: DayRow): DayState {
  return {
    ticks: row.ticks,
    roundNo: row.roundNo,
    roundStart: row.roundStart,
    roundExtra: row.roundExtra,
    goalDone: row.goalDone === 1,
    repaired: row.repaired === 1,
    repairDay: row.repairDay,
    repairRoundNo: row.repairRoundNo,
    log: JSON.parse(row.log) as DayState['log'],
  };
}

function wordFromRow(row: WordRow): WordState {
  return {
    wordId: row.wordId,
    status: row.status,
    fsrs: row.fsrs ? (JSON.parse(row.fsrs) as FsrsCard) : null,
    dots: row.dots,
    lastDotDay: row.lastDotDay,
    lastRatedDay: row.lastRatedDay,
    metAt: row.metAt,
    metOnHome: row.metOnHome === 1,
    sentenceIndex: row.sentenceIndex === 1 ? 1 : 0,
    strokeDays: row.strokeDays,
    lastStrokeDay: row.lastStrokeDay,
    strokeRemoved: row.strokeRemoved === 1,
    strokeRetired: row.strokeRetired === 1,
  };
}

async function saveDay(db: Db, key: DayKey, day: DayState): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO day_state
       (dayKey, ticks, roundNo, roundStart, roundExtra, goalDone, repaired, repairDay, repairRoundNo, log)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      key,
      day.ticks,
      day.roundNo,
      day.roundStart,
      day.roundExtra,
      flag(day.goalDone),
      flag(day.repaired),
      day.repairDay,
      day.repairRoundNo,
      JSON.stringify(day.log),
    ],
  );
}

async function saveWord(db: Db, word: WordState): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO word_state
       (wordId, status, fsrs, dots, lastDotDay, lastRatedDay, metAt, metOnHome, sentenceIndex,
        strokeDays, lastStrokeDay, strokeRemoved, strokeRetired)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      word.wordId,
      word.status,
      word.fsrs ? JSON.stringify(word.fsrs) : null,
      word.dots,
      word.lastDotDay,
      word.lastRatedDay,
      word.metAt,
      flag(word.metOnHome),
      word.sentenceIndex,
      word.strokeDays,
      word.lastStrokeDay,
      flag(word.strokeRemoved),
      flag(word.strokeRetired),
    ],
  );
}

async function wipe(db: Db): Promise<void> {
  for (const table of USER_TABLES) {
    await db.execAsync(`DELETE FROM ${table};`);
  }
  // Dev settings (the clock offset) survive a wipe so time travel and scenarios can be combined.
  await db.execAsync("DELETE FROM settings WHERE key NOT LIKE 'dev.%';");
}

// Writes the whole Home state. Simple and safe for M3–M6; the stores can narrow this to the
// rows an action touched if a save ever shows up as slow (DB-2: save after every tap).
async function writeHome(db: Db, state: HomeState): Promise<void> {
  for (const table of ['word_state', 'day_state', 'pack', 'reward_queue', 'deck_state', 'stats'] as const) {
    await db.execAsync(`DELETE FROM ${table};`);
  }
  for (const [key, day] of Object.entries(state.days)) await saveDay(db, key, day);
  for (const word of Object.values(state.words)) await saveWord(db, word);
  if (state.pack) {
    await db.runAsync('INSERT INTO pack (dayKey, seq, cards, position, history) VALUES (?, ?, ?, ?, ?);', [
      state.pack.dayKey,
      state.pack.seq,
      JSON.stringify(state.pack.cards),
      state.pack.position,
      JSON.stringify(state.pack.history),
    ]);
  }
  for (const card of state.rewardQueue) {
    await db.runAsync('INSERT INTO reward_queue (type, payload, createdAt) VALUES (?, ?, ?);', [
      card.type,
      JSON.stringify(card),
      '',
    ]);
  }
  await db.runAsync(
    'INSERT INTO deck_state (id, currentDeckId, level, completedDeckIds, peekedDeckIds) VALUES (1, ?, ?, ?, ?);',
    [state.deck.currentDeckId, state.deck.level, JSON.stringify(state.deck.completedDeckIds), '[]'],
  );
  await db.runAsync('INSERT INTO stats (id, bestStreak, charactersTraced, installDay) VALUES (1, ?, ?, ?);', [
    state.stats.bestStreak,
    state.stats.charactersTraced,
    state.stats.installDay,
  ]);
  await setSetting(db, 'newWordsPerDay', state.newWordsPerDay);
}

export async function saveHomeState(db: Db, state: HomeState): Promise<void> {
  await db.withTransactionAsync(() => writeHome(db, state));
}

/** null on a new install (no stats row yet). */
export async function loadHomeState(db: Db): Promise<HomeState | null> {
  const stats = await db.getFirstAsync<{ bestStreak: number; charactersTraced: number; installDay: string | null }>(
    'SELECT bestStreak, charactersTraced, installDay FROM stats WHERE id = 1;',
  );
  if (!stats || !stats.installDay) return null;

  const dayRows = await db.getAllAsync<DayRow>('SELECT * FROM day_state;');
  const wordRows = await db.getAllAsync<WordRow>('SELECT * FROM word_state;');
  const packRow = await db.getFirstAsync<{ dayKey: string; seq: number; cards: string; position: number; history: string }>(
    'SELECT * FROM pack ORDER BY dayKey DESC, seq DESC LIMIT 1;',
  );
  const rewardRows = await db.getAllAsync<{ payload: string }>('SELECT payload FROM reward_queue ORDER BY id;');
  const deck = await db.getFirstAsync<{ currentDeckId: string | null; level: string | null; completedDeckIds: string }>(
    'SELECT currentDeckId, level, completedDeckIds FROM deck_state WHERE id = 1;',
  );
  const newWordsPerDay = await getSetting<number>(db, 'newWordsPerDay');

  const pack: Pack | null = packRow
    ? {
        dayKey: packRow.dayKey,
        seq: packRow.seq,
        cards: JSON.parse(packRow.cards) as Pack['cards'],
        position: packRow.position,
        history: JSON.parse(packRow.history) as Pack['history'],
      }
    : null;

  return {
    days: Object.fromEntries(dayRows.map((row) => [row.dayKey, dayFromRow(row)])),
    words: Object.fromEntries(wordRows.map((row) => [row.wordId, wordFromRow(row)])),
    pack,
    rewardQueue: rewardRows.map((row) => JSON.parse(row.payload) as RewardCard),
    deck: {
      level: (deck?.level ?? 'N5') as Level,
      currentDeckId: deck?.currentDeckId ?? null,
      completedDeckIds: deck ? (JSON.parse(deck.completedDeckIds) as string[]) : [],
    },
    stats: { bestStreak: stats.bestStreak, charactersTraced: stats.charactersTraced, installDay: stats.installDay },
    newWordsPerDay: newWordsPerDay === 2 ? 2 : 3,
  };
}

/** Dev menu "Reset": back to a new install. */
export async function resetUserState(db: Db): Promise<void> {
  await db.withTransactionAsync(() => wipe(db));
}

/** Dev menu "Load scenario": wipe user state and write this one. */
export async function writeScenario(db: Db, state: ScenarioState): Promise<void> {
  await db.withTransactionAsync(async () => {
    await wipe(db);
    await writeHome(db, state);
    await setSetting(db, 'appearance', state.appearance);
    await setSetting(db, 'pictureStyle', state.pictureStyle);
  });
}
