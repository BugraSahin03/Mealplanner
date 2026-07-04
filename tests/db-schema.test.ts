import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase, getSchemaVersion } from "../src/db/client";
import type { SqliteDatabase } from "../src/db/sqlite";
import { getProfile, listProfiles } from "../src/profiles/repository";

let db: SqliteDatabase;

describe("database schema", () => {
  beforeEach(() => {
    db = createDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("applies EP-002 schema and seeds the two MVP profiles", () => {
    const tables = db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
          ORDER BY name
        `,
      )
      .all() as Array<{ name: string }>;

    expect(tables.map((table) => table.name)).toEqual(
      expect.arrayContaining([
        "profiles",
        "week_contexts",
        "week_context_person_days",
        "planner_jobs",
        "week_plans",
        "planned_meals",
        "shopping_items",
      ]),
    );
    expect(getSchemaVersion(db)).toBe("0002_ep_005");
    expect(listProfiles(db).map((profile) => profile.personId)).toEqual(["bugra", "sena"]);
    expect(getProfile(db, "bugra")?.primaryGoal).toBe("muscle_gain");
  });

  it("stores planner job error codes for failed long-running jobs", () => {
    const columns = db
      .prepare("PRAGMA table_info(planner_jobs)")
      .all() as Array<{ name: string }>;

    expect(columns.map((column) => column.name)).toContain("error_code");
  });

  it("enforces planner job statuses", () => {
    expect(() => {
      db.prepare(
        `
          INSERT INTO planner_jobs (job_id, status, request_json)
          VALUES ('invalid-job', 'queued', '{}')
        `,
      ).run();
    }).toThrow();
  });
});
