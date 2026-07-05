"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/src/db/client";
import {
  completeLatestPlannerJobWithDemoResponse,
  createCurrentWeekPlannerJob,
  failLatestPlannerJobWithDemoError,
  startLatestPlannerJob,
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

export async function startPlannerJobAction(): Promise<void> {
  startLatestPlannerJob(getDb());
  revalidatePlannerViews();
}

export async function completePlannerJobAction(): Promise<void> {
  completeLatestPlannerJobWithDemoResponse(getDb());
  revalidatePlannerViews();
}

export async function failPlannerJobAction(): Promise<void> {
  failLatestPlannerJobWithDemoError(getDb());
  revalidatePlannerViews();
}
