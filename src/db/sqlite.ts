import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

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

export function openSqliteDatabase(location: string): SqliteDatabase {
  if (location !== ":memory:") {
    mkdirSync(path.dirname(path.resolve(location)), { recursive: true });
  }

  const db = new DatabaseSync(location);
  db.exec("PRAGMA foreign_keys = ON;");

  return db;
}
