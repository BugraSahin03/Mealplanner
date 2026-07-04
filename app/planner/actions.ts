"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/src/db/client";
import {
  completeLatestPlannerJobWithDemoResponse,
  createCurrentWeekPlannerJob,
  failLatestPlannerJobWithDemoError,
  startLatestPlannerJob,
} from "@/src/planner/job-flow";

function revalidatePlannerViews(): void {
  revalidatePath("/planner");
  revalidatePath("/");
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
