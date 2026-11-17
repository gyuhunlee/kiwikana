import { describe, expect, it } from 'vitest';
import { pendingMigrations, type Migration } from './migrate.logic';

const migration = (version: number): Migration => ({ version, name: `m${version}`, sql: '' });
const all = [migration(1), migration(2), migration(3)];

describe('pendingMigrations', () => {
  it('runs everything on a new database', () => {
    expect(pendingMigrations(0, all).map((m) => m.version)).toEqual([1, 2, 3]);
  });

  it('runs only the migrations after the current version', () => {
    expect(pendingMigrations(2, all).map((m) => m.version)).toEqual([3]);
  });

  it('runs nothing when up to date', () => {
    expect(pendingMigrations(3, all)).toEqual([]);
  });

  it('refuses a database from a newer build', () => {
    expect(() => pendingMigrations(4, all)).toThrow();
  });

  it('refuses a gap or wrong order in the list', () => {
    expect(() => pendingMigrations(0, [migration(1), migration(3)])).toThrow();
    expect(() => pendingMigrations(0, [migration(2), migration(1)])).toThrow();
  });
});
