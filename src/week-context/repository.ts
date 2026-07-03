import type { SqliteDatabase } from "../db/sqlite";
import { getWeekContext, saveWeekContext, type WeekContext } from "../planner/repository";
import { buildDefaultWeekContext, ensureCompleteWeekContext } from "./model";

export function getOrCreateCurrentWeekContext(
  db: SqliteDatabase,
  referenceDate = new Date(),
): WeekContext {
  const fallback = buildDefaultWeekContext(referenceDate);
  const existing = getWeekContext(db, fallback.weekId);

  if (existing) {
    return ensureCompleteWeekContext(existing);
  }

  return saveCurrentWeekContext(db, fallback);
}

export function saveCurrentWeekContext(
  db: SqliteDatabase,
  context: WeekContext,
): WeekContext {
  return saveWeekContext(db, ensureCompleteWeekContext(context));
}
