import type { SqliteDatabase } from "../db/sqlite";
import { listProfiles } from "../profiles/repository";
import { getOrCreateCurrentWeekContext } from "../week-context/repository";
import { buildPlannerRequestFromWeekContext } from "./request";
import {
  completePlannerJob,
  createPlannerJob,
  failPlannerJob,
  getLatestPlannerJob,
  startPlannerJob,
  type PlannerJob,
} from "./repository";
import { buildDemoPlannerResponse } from "./response";

export function createCurrentWeekPlannerJob(db: SqliteDatabase): PlannerJob {
  const weekContext = getOrCreateCurrentWeekContext(db);
  const profiles = listProfiles(db);
  const request = buildPlannerRequestFromWeekContext(weekContext, profiles);

  return createPlannerJob(db, {
    weekId: weekContext.weekId,
    request,
  });
}

export function startLatestPlannerJob(db: SqliteDatabase): PlannerJob {
  const job = getLatestPlannerJob(db);
  if (!job) {
    return startPlannerJob(db, createCurrentWeekPlannerJob(db).jobId);
  }
  return startPlannerJob(db, job.jobId);
}

export function completeLatestPlannerJobWithDemoResponse(db: SqliteDatabase): PlannerJob {
  const job = getLatestPlannerJob(db);
  if (!job) {
    const created = createCurrentWeekPlannerJob(db);
    startPlannerJob(db, created.jobId);
    return completePlannerJob(db, created.jobId, buildDemoPlannerResponse());
  }
  return completePlannerJob(db, job.jobId, buildDemoPlannerResponse());
}

export function failLatestPlannerJobWithDemoError(db: SqliteDatabase): PlannerJob {
  const job = getLatestPlannerJob(db);
  if (!job) {
    const created = createCurrentWeekPlannerJob(db);
    startPlannerJob(db, created.jobId);
    return failPlannerJob(db, created.jobId, {
      errorCode: "demo_openclaw_timeout",
      errorMessage: "Demo-Fehler: Planner-Aufruf hat zu lange gedauert.",
    });
  }
  return failPlannerJob(db, job.jobId, {
    errorCode: "demo_openclaw_timeout",
    errorMessage: "Demo-Fehler: Planner-Aufruf hat zu lange gedauert.",
  });
}
