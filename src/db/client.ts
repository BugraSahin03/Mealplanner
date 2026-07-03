import { applyMigrations, getLatestSchemaVersion } from "./schema";
import { openSqliteDatabase, type SqliteDatabase } from "./sqlite";

export const DATABASE_PATH_ENV = "ESSENPLANNER_DB_PATH";
export const DEFAULT_DATABASE_PATH = "data/essenplanner.db";

let db: SqliteDatabase | null = null;

export function resolveDatabasePath(env: NodeJS.ProcessEnv = process.env): string {
  return env[DATABASE_PATH_ENV]?.trim() || DEFAULT_DATABASE_PATH;
}

export function createDatabase(location = ":memory:"): SqliteDatabase {
  const database = openSqliteDatabase(location);
  applyMigrations(database);

  return database;
}

export function getDb(): SqliteDatabase {
  if (!db) {
    db = createDatabase(resolveDatabasePath());
  }

  return db;
}

export function closeDb(): void {
  db?.close();
  db = null;
}

export function getSchemaVersion(database = getDb()): string {
  const row = database
    .prepare("SELECT value FROM app_meta WHERE key = 'schema_version' LIMIT 1")
    .get() as { value?: string } | undefined;

  return row?.value ?? getLatestSchemaVersion();
}
