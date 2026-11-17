export interface Migration {
  /** 1, 2, 3 … with no gaps. A shipped migration is never edited. */
  version: number;
  name: string;
  sql: string;
}

export function pendingMigrations(currentVersion: number, all: readonly Migration[]): Migration[] {
  all.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(`Migration "${migration.name}" has version ${migration.version}, expected ${index + 1}`);
    }
  });
  if (currentVersion > all.length) {
    // The database was written by a newer build. Running old code on it could break saved user data.
    throw new Error(`Database is at version ${currentVersion}, this build only knows ${all.length}`);
  }
  return all.slice(currentVersion);
}
