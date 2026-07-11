"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/src/db/client";
import {
  createPlannerJobForWeek,
  runPlannerJobWithConfiguredAdapter,
  runLatestPlannerJobWithConfiguredAdapter,
} from "@/src/planner/job-flow";
import { buildWeekContextFromFormData } from "@/src/week-context/form";
import { saveCurrentWeekContext } from "@/src/week-context/repository";
import { resolveWeekIdFromParam } from "@/src/week-context/weeks";

function revalidatePlannerViews(): void {
  revalidatePath("/plan");
  revalidatePath("/planner");
  revalidatePath("/shopping-list");
  revalidatePath("/weeks");
  revalidatePath("/");
}

export async function savePlannerWeekContextAction(formData: FormData): Promise<void> {
  saveCurrentWeekContext(getDb(), buildWeekContextFromFormData(formData));
  revalidatePlannerViews();
}

export async function createPlannerJobAction(formData: FormData): Promise<void> {
  const weekId = resolveWeekIdFromParam(formData.get("weekId")?.toString());
  if (!weekId) {
    throw new Error("Kalenderwoche fehlt.");
  }

  createPlannerJobForWeek(getDb(), weekId);
  revalidatePlannerViews();
}

export async function runPlannerJobAction(formData: FormData): Promise<void> {
  const jobId = formData.get("jobId");
  if (typeof jobId === "string" && jobId.trim()) {
    await runPlannerJobWithConfiguredAdapter(getDb(), jobId.trim());
  } else {
    await runLatestPlannerJobWithConfiguredAdapter(getDb());
  }

  revalidatePlannerViews();
}
