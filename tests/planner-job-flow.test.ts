import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/client";
import type { SqliteDatabase } from "../src/db/sqlite";
import { FixturePlannerAdapter, type PlannerAdapter } from "../src/planner/adapter";
import {
  createPlannerJobForWeek,
  runLatestPlannerJobWithConfiguredAdapter,
  runPlannerJobWithConfiguredAdapter,
  startPlannerJobForWeek,
} from "../src/planner/job-flow";
import {
  completePlannerJob,
  createPlannerJob,
  getLatestPlannerJob,
  getLatestPlannerJobForWeek,
  getLatestSuccessfulPlannerJobForWeek,
  listPlannerJobsForWeek,
  startPlannerJob,
} from "../src/planner/repository";
import { buildDemoPlannerResponse } from "../src/planner/response";
import { getOrCreateWeekContextById } from "../src/week-context/repository";

let db: SqliteDatabase;

describe("planner job flow", () => {
  beforeEach(() => {
    db = createDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("creates a current-week job and stores a valid fixture planner response", async () => {
    const result = await runLatestPlannerJobWithConfiguredAdapter(db, new FixturePlannerAdapter());
    const saved = getLatestPlannerJob(db);

    expect(result.status).toBe("success");
    expect(saved?.status).toBe("success");
    expect(saved?.weekId).toMatch(/^\d{4}-W\d{2}$/);
    expect(saved?.response).toMatchObject({
      schemaVersion: "1.0",
      plan: { title: "Demo-Wochenplan" },
    });
    expect(saved?.errorMessage).toBeNull();
  });

  it("stores adapter failures on the job without a planner response", async () => {
    const failingAdapter: PlannerAdapter = {
      async createPlan() {
        throw new Error("OpenClaw CLI exited with code 1.");
      },
    };

    const result = await runLatestPlannerJobWithConfiguredAdapter(db, failingAdapter);
    const saved = getLatestPlannerJob(db);

    expect(result.status).toBe("failed");
    expect(saved?.status).toBe("failed");
    expect(saved?.response).toBeNull();
    expect(saved?.errorCode).toBe("planner_adapter_failed");
    expect(saved?.errorMessage).toBe("OpenClaw CLI exited with code 1.");
  });

  it("creates planner jobs for the explicitly selected week", () => {
    const job = createPlannerJobForWeek(db, "2026-W30");
    const saved = getLatestPlannerJobForWeek(db, "2026-W30");

    expect(job.weekId).toBe("2026-W30");
    expect(saved?.weekId).toBe("2026-W30");
    expect(saved?.request).toMatchObject({
      week: {
        calendarYear: 2026,
        calendarWeek: 30,
        weekStartDate: "2026-07-20",
      },
    });
  });

  it("keeps the latest successful plan discoverable after a new draft job", async () => {
    const successful = await runLatestPlannerJobWithConfiguredAdapter(db, new FixturePlannerAdapter());
    const nextDraft = createPlannerJobForWeek(db, successful.weekId ?? "2026-W30");

    expect(getLatestPlannerJobForWeek(db, successful.weekId ?? "")?.jobId).toBe(nextDraft.jobId);
    expect(getLatestSuccessfulPlannerJobForWeek(db, successful.weekId ?? "")?.jobId).toBe(successful.jobId);

    startPlannerJob(db, nextDraft.jobId);
    expect(getLatestSuccessfulPlannerJobForWeek(db, successful.weekId ?? "")?.jobId).toBe(successful.jobId);
  });

  it("reuses a running job for the same week instead of creating duplicates", () => {
    const first = startPlannerJobForWeek(db, "2026-W30");
    const second = startPlannerJobForWeek(db, "2026-W30");

    expect(first.job.status).toBe("running");
    expect(first.startedNewJob).toBe(true);
    expect(second.job.jobId).toBe(first.job.jobId);
    expect(second.startedNewJob).toBe(false);
    expect(listPlannerJobsForWeek(db, "2026-W30")).toHaveLength(1);
  });

  it("dispatches the adapter only for the newly started job", async () => {
    let adapterCalls = 0;
    const adapter: PlannerAdapter = {
      async createPlan() {
        adapterCalls += 1;
        return new FixturePlannerAdapter().createPlan();
      },
    };
    const starts = [
      startPlannerJobForWeek(db, "2026-W30"),
      startPlannerJobForWeek(db, "2026-W30"),
    ];

    await Promise.all(
      starts
        .filter((start) => start.startedNewJob)
        .map((start) => runPlannerJobWithConfiguredAdapter(db, start.job.jobId, adapter)),
    );

    expect(adapterCalls).toBe(1);
    expect(listPlannerJobsForWeek(db, "2026-W30")).toHaveLength(1);
    expect(getLatestPlannerJobForWeek(db, "2026-W30")?.status).toBe("success");
  });

  it("adds the latest four prior successful weeks as compact planning history", () => {
    const saveSuccessfulRun = (weekId: string, jobId: string) => {
      getOrCreateWeekContextById(db, weekId);
      createPlannerJob(db, { weekId, jobId, request: { schemaVersion: "1.0" } });
      startPlannerJob(db, jobId);
      completePlannerJob(db, jobId, buildDemoPlannerResponse());
    };

    saveSuccessfulRun("2026-W25", "w25");
    saveSuccessfulRun("2026-W26", "w26");
    saveSuccessfulRun("2026-W27", "w27");
    saveSuccessfulRun("2026-W28", "w28-first");
    saveSuccessfulRun("2026-W28", "w28-newest");
    saveSuccessfulRun("2026-W29", "w29");
    const target = createPlannerJobForWeek(db, "2026-W30");
    const request = target.request as {
      planningHistory?: { latestWeeks: Array<{ weekId: string; meals: { dinner: unknown[] } }> };
    };

    expect(request.planningHistory?.latestWeeks.map((week) => week.weekId)).toEqual([
      "2026-W29",
      "2026-W28",
      "2026-W27",
      "2026-W26",
    ]);
    expect(request.planningHistory?.latestWeeks[1]?.meals.dinner).toHaveLength(4);
  });
});
