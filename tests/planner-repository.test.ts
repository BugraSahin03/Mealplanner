import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/client";
import type { SqliteDatabase } from "../src/db/sqlite";
import {
  createPlannerJob,
  completePlannerJob,
  failPlannerJob,
  getPlannerJob,
  getWeekContext,
  getWeekPlan,
  saveWeekContext,
  saveWeekPlan,
  startPlannerJob,
  updatePlannerJobStatus,
} from "../src/planner/repository";
import { buildDemoPlannerResponse } from "../src/planner/response";

let db: SqliteDatabase;

describe("planner repository", () => {
  beforeEach(() => {
    db = createDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("stores weekly person contexts and replaces day rows on update", () => {
    saveWeekContext(db, {
      weekId: "2026-W28",
      weekStartDate: "2026-07-06",
      notes: "Testwoche",
      days: [
        {
          dayId: "monday",
          date: "2026-07-06",
          weekday: "monday",
          personId: "bugra",
          dayContext: "office",
        },
        {
          dayId: "monday",
          date: "2026-07-06",
          weekday: "monday",
          personId: "sena",
          dayContext: "home",
        },
      ],
    });

    saveWeekContext(db, {
      weekId: "2026-W28",
      weekStartDate: "2026-07-06",
      days: [
        {
          dayId: "monday",
          date: "2026-07-06",
          weekday: "monday",
          personId: "bugra",
          dayContext: "home",
        },
      ],
    });

    const context = getWeekContext(db, "2026-W28");
    expect(context?.days).toEqual([
      {
        dayId: "monday",
        date: "2026-07-06",
        weekday: "monday",
        personId: "bugra",
        dayContext: "home",
        notes: null,
      },
    ]);
  });

  it("tracks planner job lifecycle from idle to success", () => {
    saveWeekContext(db, {
      weekId: "2026-W28",
      weekStartDate: "2026-07-06",
      days: [],
    });

    const job = createPlannerJob(db, {
      jobId: "job-1",
      weekId: "2026-W28",
      request: { schemaVersion: "1.0" },
    });

    expect(job.status).toBe("idle");

    const running = startPlannerJob(db, "job-1");
    expect(running.status).toBe("running");
    expect(running.completedAt).toBeNull();
    expect(running.errorCode).toBeNull();

    const success = completePlannerJob(db, "job-1", buildDemoPlannerResponse());

    expect(success.status).toBe("success");
    expect(success.response).toMatchObject({ schemaVersion: "1.0" });
    expect(success.completedAt).toEqual(expect.any(String));
    expect(getPlannerJob(db, "job-1")?.weekId).toBe("2026-W28");
  });

  it("stores failed planner job details and allows retry from failed to running", () => {
    const job = createPlannerJob(db, {
      jobId: "job-failed",
      request: { schemaVersion: "1.0" },
    });

    expect(job.status).toBe("idle");

    startPlannerJob(db, "job-failed");
    const failed = failPlannerJob(db, "job-failed", {
      errorCode: "openclaw_timeout",
      errorMessage: "OpenClaw hat zu lange gebraucht.",
    });

    expect(failed.status).toBe("failed");
    expect(failed.errorCode).toBe("openclaw_timeout");
    expect(failed.errorMessage).toBe("OpenClaw hat zu lange gebraucht.");
    expect(failed.completedAt).toEqual(expect.any(String));

    const retrying = startPlannerJob(db, "job-failed");
    expect(retrying.status).toBe("running");
    expect(retrying.errorCode).toBeNull();
    expect(retrying.errorMessage).toBeNull();
    expect(retrying.completedAt).toBeNull();
  });

  it("rejects invalid job transitions and invalid success responses", () => {
    createPlannerJob(db, {
      jobId: "job-invalid",
      request: { schemaVersion: "1.0" },
    });

    expect(() => {
      updatePlannerJobStatus(db, "job-invalid", "success", {
        response: buildDemoPlannerResponse(),
      });
    }).toThrow("Invalid planner job transition");

    startPlannerJob(db, "job-invalid");

    expect(() => {
      completePlannerJob(db, "job-invalid", {
        schemaVersion: "1.0",
        plan: { days: [] },
        shoppingList: [],
      });
    }).toThrow("Invalid planner response");
  });

  it("stores week plan payload, meals and shopping list", () => {
    saveWeekContext(db, {
      weekId: "2026-W28",
      weekStartDate: "2026-07-06",
      days: [],
    });
    createPlannerJob(db, {
      jobId: "job-1",
      weekId: "2026-W28",
      status: "success",
      request: { schemaVersion: "1.0" },
    });

    saveWeekPlan(db, {
      planId: "plan-1",
      weekId: "2026-W28",
      plannerJobId: "job-1",
      title: "Testplan",
      summary: "Eine gespeicherte Woche",
      plan: { title: "Testplan", days: [{ dayId: "monday" }] },
      meals: [
        {
          mealId: "monday-dinner",
          dayId: "monday",
          weekday: "monday",
          mealType: "dinner",
          title: "Pasta mit Salat",
          context: "shared",
          people: [{ personId: "bugra" }, { personId: "sena" }],
          ingredients: [{ name: "Nudeln", amount: 250, unit: "g" }],
        },
      ],
      shoppingList: [
        {
          name: "Nudeln",
          amount: 500,
          unit: "g",
          category: "dry_goods",
          sourceMealIds: ["monday-dinner"],
          buyingHint: "500-g-Packung kaufen",
        },
      ],
    });

    const plan = getWeekPlan(db, "plan-1");

    expect(plan?.title).toBe("Testplan");
    expect(plan?.meals).toHaveLength(1);
    expect(plan?.meals[0]?.ingredients).toEqual([
      { name: "Nudeln", amount: 250, unit: "g" },
    ]);
    expect(plan?.shoppingList).toEqual([
      {
        name: "Nudeln",
        amount: 500,
        unit: "g",
        category: "dry_goods",
        sourceMealIds: ["monday-dinner"],
        buyingHint: "500-g-Packung kaufen",
      },
    ]);
  });
});
