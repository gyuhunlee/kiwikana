import type { Migration } from '../migrate.logic';

// User state tables from docs/architecture.md (Data model). JSON fields are TEXT.
export const initial: Migration = {
  version: 1,
  name: 'initial',
  sql: `
    CREATE TABLE word_state (
      wordId TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      fsrs TEXT,
      dots INTEGER NOT NULL DEFAULT 0,
      lastDotDay TEXT,
      lastRatedDay TEXT,
      metAt TEXT,
      metOnHome INTEGER NOT NULL DEFAULT 0,
      sentenceIndex INTEGER NOT NULL DEFAULT 0,
      strokeDays INTEGER NOT NULL DEFAULT 0,
      lastStrokeDay TEXT,
      strokeRemoved INTEGER NOT NULL DEFAULT 0,
      strokeRetired INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE day_state (
      dayKey TEXT PRIMARY KEY NOT NULL,
      ticks INTEGER NOT NULL DEFAULT 0,
      roundNo INTEGER NOT NULL DEFAULT 1,
      roundStart INTEGER NOT NULL DEFAULT 0,
      roundExtra INTEGER NOT NULL DEFAULT 0,
      goalDone INTEGER NOT NULL DEFAULT 0,
      repaired INTEGER NOT NULL DEFAULT 0,
      repairDay TEXT,
      log TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE pack (
      dayKey TEXT NOT NULL,
      seq INTEGER NOT NULL,
      cards TEXT NOT NULL DEFAULT '[]',
      position INTEGER NOT NULL DEFAULT 0,
      history TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (dayKey, seq)
    );

    CREATE TABLE kana_state (
      script TEXT NOT NULL,
      kana TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      seen INTEGER NOT NULL DEFAULT 0,
      lastDrilled TEXT,
      lastWrong TEXT,
      knownByUser INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (script, kana)
    );

    CREATE TABLE kana_progress (
      script TEXT PRIMARY KEY NOT NULL,
      unlockedGroups TEXT NOT NULL DEFAULT '[]',
      batch TEXT,
      batchPosition INTEGER NOT NULL DEFAULT 0,
      rotation TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE stroke_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      position INTEGER NOT NULL DEFAULT 0,
      tracedToday TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE reward_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE deck_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      currentDeckId TEXT,
      level TEXT,
      completedDeckIds TEXT NOT NULL DEFAULT '[]',
      peekedDeckIds TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      bestStreak INTEGER NOT NULL DEFAULT 0,
      charactersTraced INTEGER NOT NULL DEFAULT 0,
      installDay TEXT
    );

    CREATE TABLE graded_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dayKey TEXT NOT NULL,
      correct INTEGER NOT NULL
    );
    CREATE INDEX graded_log_day ON graded_log (dayKey);

    CREATE TABLE undo (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      snapshot TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );
  `,
};
