"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { getDb } from "@/src/db/client";
import {
  runPlannerJobWithConfiguredAdapter,
  startPlannerJobForWeek,
} from "@/src/planner/job-flow";
import {
  getLatestPlannerJobForWeek,
  getLatestSuccessfulPlannerJobForWeek,
  type PlannerJob,
} from "@/src/planner/repository";
import { buildWeekHref, resolveWeekIdFromParam } from "@/src/week-context/weeks";
import { presentPlannerError, type PlannerStatusSnapshot } from "./status";

function revalidatePlanWorkflow(): void {
  revalidatePath("/plan");
  revalidatePath("/planner");
  revalidatePath("/shopping-list");
  revalidatePath("/weeks");
  revalidatePath("/");
}

function requireWeekId(value: unknown): string {
  const weekId = resolveWeekIdFromParam(typeof value === "string" ? value : undefined);
  if (!weekId) {
    throw new Error("Kalenderwoche fehlt.");
  }

  return weekId;
}

function buildStatusSnapshot(weekId: string, job: PlannerJob | null): PlannerStatusSnapshot {
  const db = getDb();

  return {
    jobId: job?.jobId ?? null,
    status: job?.status ?? "idle",
    errorMessage: presentPlannerError(job),
    updatedAt: job?.updatedAt ?? null,
    hasPlan: getLatestSuccessfulPlannerJobForWeek(db, weekId) !== null,
  };
}

export async function getPlannerStatusAction(weekIdInput: string): Promise<PlannerStatusSnapshot> {
  const weekId = requireWeekId(weekIdInput);
  const job = getLatestPlannerJobForWeek(getDb(), weekId);
  return buildStatusSnapshot(weekId, job);
}

export async function startPlannerJobForWeekAction(weekIdInput: string): Promise<PlannerStatusSnapshot> {
  const weekId = requireWeekId(weekIdInput);
  const db = getDb();
  const { job: runningJob, startedNewJob } = startPlannerJobForWeek(db, weekId);

  if (startedNewJob) {
    after(async () => {
      await runPlannerJobWithConfiguredAdapter(getDb(), runningJob.jobId);
      revalidatePlanWorkflow();
    });
  }

  revalidatePlanWorkflow();
  return buildStatusSnapshot(weekId, runningJob);
}

export async function createAndRunPlannerJobForWeekAction(formData: FormData): Promise<void> {
  const weekId = requireWeekId(formData.get("weekId")?.toString());
  await startPlannerJobForWeekAction(weekId);
  redirect(buildWeekHref("/plan", weekId));
}
