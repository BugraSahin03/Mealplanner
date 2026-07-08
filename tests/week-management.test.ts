import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/client";
import type { SqliteDatabase } from "../src/db/sqlite";
import { createPlannerJobForWeek } from "../src/planner/job-flow";
import { completePlannerJob, startPlannerJob } from "../src/planner/repository";
import { buildDemoPlannerResponse } from "../src/planner/response";
import { buildWeekContextForStartDate } from "../src/week-context/model";
import { getOrCreateWeekContextById } from "../src/week-context/repository";
import {
  buildWeekSummaries,
  buildWeekSwitcherState,
  getWeekLabel,
  resolveWeekIdFromParam,
} from "../src/week-context/weeks";

let db: SqliteDatabase;

describe("week management", () => {
  beforeEach(() => {
    db = createDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("creates selectable week contexts by calendar week id", () => {
    const context = getOrCreateWeekContextById(db, "2026-W29");

    expect(context.weekId).toBe("2026-W29");
    expect(context.weekStartDate).toBe("2026-07-13");
    expect(context.calendarYear).toBe(2026);
    expect(context.calendarWeek).toBe(29);
    expect(context.days).toHaveLength(14);
    expect(getWeekLabel(context, { withYear: true })).toContain("2026 / KW 29");
  });

  it("builds previous and next week switcher targets", () => {
    const context = buildWeekContextForStartDate(new Date("2026-07-13T00:00:00"));
    const switcher = buildWeekSwitcherState(context);

    expect(switcher.previous.weekId).toBe("2026-W28");
    expect(switcher.current.weekId).toBe("2026-W29");
    expect(switcher.next.weekId).toBe("2026-W30");
  });

  it("groups current, planned and past weeks with status signals", () => {
    const futureContext = getOrCreateWeekContextById(db, "2026-W30");
    const job = createPlannerJobForWeek(db, futureContext.weekId);
    startPlannerJob(db, job.jobId);
    completePlannerJob(db, job.jobId, buildDemoPlannerResponse());

    const summaries = buildWeekSummaries(db, new Date("2026-07-15T12:00:00+02:00"));

    expect(summaries.some((summary) => summary.bucket === "current" && summary.context.weekId === "2026-W29")).toBe(true);
    expect(summaries.some((summary) => summary.bucket === "past" && summary.context.weekId === "2026-W28")).toBe(true);
    expect(
      summaries.some(
        (summary) =>
          summary.bucket === "planned"
          && summary.context.weekId === "2026-W30"
          && summary.hasPlannerJob
          && summary.hasWeekPlan
          && summary.hasShoppingList
          && summary.status === "shopping_ready",
      ),
    ).toBe(true);
  });

  it("accepts only canonical week query params", () => {
    expect(resolveWeekIdFromParam("2026-W29")).toBe("2026-W29");
    expect(resolveWeekIdFromParam("2026-29")).toBeNull();
    expect(resolveWeekIdFromParam(["2026-W29"])).toBeNull();
  });
});
