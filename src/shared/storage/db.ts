import * as SQLite from 'expo-sqlite';
import { pendingMigrations } from './migrate.logic';
import { migrations } from './migrations';

export type Db = SQLite.SQLiteDatabase;

const DATABASE_NAME = 'kiwikana.db';

let opening: Promise<Db> | null = null;

/** The one database, opened and migrated on first use. */
export function getDb(): Promise<Db> {
  opening ??= open();
  return opening;
}

async function open(): Promise<Db> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  for (const migration of pendingMigrations(row?.user_version ?? 0, migrations)) {
    // Schema and version move together, so a crash mid-migration leaves the old version intact.
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}
