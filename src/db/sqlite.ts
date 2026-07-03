import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export type SqliteRunResult = {
  changes: number;
  lastInsertRowid: number | bigint;
};

export type SqliteStatement = {
  all: (...params: unknown[]) => unknown[];
  get: (...params: unknown[]) => unknown;
  run: (...params: unknown[]) => SqliteRunResult;
};

export type SqliteDatabase = {
  close: () => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
};

type DatabaseSyncConstructor = new (location: string) => SqliteDatabase;

const require = createRequire(import.meta.url);

export function openSqliteDatabase(location: string): SqliteDatabase {
  if (location !== ":memory:") {
    mkdirSync(path.dirname(path.resolve(location)), { recursive: true });
  }

  const { DatabaseSync } = require("node:sqlite") as {
    DatabaseSync: DatabaseSyncConstructor;
  };
  const db = new DatabaseSync(location);
  db.exec("PRAGMA foreign_keys = ON;");

  return db;
}
