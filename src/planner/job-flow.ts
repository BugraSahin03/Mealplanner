import type { SqliteDatabase } from "../db/sqlite";
import { listProfiles } from "../profiles/repository";
import { getOrCreateCurrentWeekContext, getOrCreateWeekContextById } from "../week-context/repository";
import { buildPlannerRequestFromWeekContext } from "./request";
import { buildPlannerHistory } from "./history";
import { createPlannerAdapterFromEnv, runPlannerJob, type PlannerAdapter } from "./adapter";
import {
  completePlannerJob,
  createPlannerJob,
  failPlannerJob,
  getLatestPlannerJob,
  getLatestPlannerJobForWeek,
  listLatestSuccessfulPlannerJobsBeforeWeek,
  startPlannerJob,
  type PlannerJob,
} from "./repository";
import { buildDemoPlannerResponse } from "./response";

export function createCurrentWeekPlannerJob(db: SqliteDatabase): PlannerJob {
  const weekContext = getOrCreateCurrentWeekContext(db);
  return createPlannerJobForWeek(db, weekContext.weekId);
}

export function createPlannerJobForWeek(
  db: SqliteDatabase,
  weekId: string,
): PlannerJob {
  const weekContext = getOrCreateWeekContextById(db, weekId);
  const profiles = listProfiles(db);
  const history = buildPlannerHistory(
    listLatestSuccessfulPlannerJobsBeforeWeek(db, weekContext.weekId),
  );
  const request = buildPlannerRequestFromWeekContext(weekContext, profiles, history);

  return createPlannerJob(db, {
    weekId: weekContext.weekId,
    request,
  });
}

export type StartPlannerJobResult = {
  job: PlannerJob;
  startedNewJob: boolean;
};

export function startPlannerJobForWeek(
  db: SqliteDatabase,
  weekId: string,
): StartPlannerJobResult {
  const latestJob = getLatestPlannerJobForWeek(db, weekId);
  if (latestJob?.status === "running") {
    return { job: latestJob, startedNewJob: false };
  }

  const job = createPlannerJobForWeek(db, weekId);
  return { job: startPlannerJob(db, job.jobId), startedNewJob: true };
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

export async function runLatestPlannerJobWithConfiguredAdapter(
  db: SqliteDatabase,
  adapter: PlannerAdapter = createPlannerAdapterFromEnv(),
): Promise<PlannerJob> {
  const job = getLatestPlannerJob(db) ?? createCurrentWeekPlannerJob(db);
  return runPlannerJob(db, job.jobId, adapter);
}

export async function runPlannerJobWithConfiguredAdapter(
  db: SqliteDatabase,
  jobId: string,
  adapter: PlannerAdapter = createPlannerAdapterFromEnv(),
): Promise<PlannerJob> {
  return runPlannerJob(db, jobId, adapter);
}
