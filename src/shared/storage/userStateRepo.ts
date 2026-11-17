import type { DayState } from '../../home/bar/day.types';
import type { ScenarioState } from '../testing/scenarios';
import type { DayKey } from '../time/dayKey.logic';
import type { Db } from './db';
import { setSetting } from './settingsRepo';

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

interface DayRow {
  ticks: number;
  roundNo: number;
  roundStart: number;
  roundExtra: number;
  goalDone: number;
  repaired: number;
  repairDay: string | null;
  log: string;
}

export async function loadDay(db: Db, key: DayKey): Promise<DayState | null> {
  const row = await db.getFirstAsync<DayRow>('SELECT * FROM day_state WHERE dayKey = ?;', [key]);
  if (!row) return null;
  return {
    ticks: row.ticks,
    roundNo: row.roundNo,
    roundStart: row.roundStart,
    roundExtra: row.roundExtra,
    goalDone: row.goalDone === 1,
    repaired: row.repaired === 1,
    repairDay: row.repairDay,
    log: JSON.parse(row.log) as DayState['log'],
  };
}

export async function saveDay(db: Db, key: DayKey, day: DayState): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO day_state
       (dayKey, ticks, roundNo, roundStart, roundExtra, goalDone, repaired, repairDay, log)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      key,
      day.ticks,
      day.roundNo,
      day.roundStart,
      day.roundExtra,
      day.goalDone ? 1 : 0,
      day.repaired ? 1 : 0,
      day.repairDay,
      JSON.stringify(day.log),
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

/** Dev menu "Reset": back to a new install. */
export async function resetUserState(db: Db): Promise<void> {
  await db.withTransactionAsync(() => wipe(db));
}

/** Dev menu "Load scenario": wipe user state and write this one. */
export async function writeScenario(db: Db, state: ScenarioState): Promise<void> {
  await db.withTransactionAsync(async () => {
    await wipe(db);
    for (const [key, day] of Object.entries(state.days)) {
      await saveDay(db, key, day);
    }
    for (const [key, value] of Object.entries(state.settings)) {
      await setSetting(db, key, value);
    }
    await db.runAsync(
      'INSERT INTO stats (id, bestStreak, charactersTraced, installDay) VALUES (1, ?, ?, ?);',
      [state.stats.bestStreak, state.stats.charactersTraced, state.stats.installDay],
    );
  });
}
