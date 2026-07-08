"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/src/db/client";
import {
  createCurrentWeekPlannerJob,
  runLatestPlannerJobWithConfiguredAdapter,
} from "@/src/planner/job-flow";
import { buildWeekContextFromFormData } from "@/src/week-context/form";
import { saveCurrentWeekContext } from "@/src/week-context/repository";

function revalidatePlannerViews(): void {
  revalidatePath("/planner");
  revalidatePath("/week");
  revalidatePath("/");
}

export async function savePlannerWeekContextAction(formData: FormData): Promise<void> {
  saveCurrentWeekContext(getDb(), buildWeekContextFromFormData(formData));
  revalidatePlannerViews();
}

export async function createPlannerJobAction(): Promise<void> {
  createCurrentWeekPlannerJob(getDb());
  revalidatePlannerViews();
}

export async function runPlannerJobAction(): Promise<void> {
  await runLatestPlannerJobWithConfiguredAdapter(getDb());
  revalidatePlannerViews();
}
