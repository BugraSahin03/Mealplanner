"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/src/db/client";
import { createPlannerJobForWeek, runPlannerJobWithConfiguredAdapter } from "@/src/planner/job-flow";
import { resolveWeekIdFromParam } from "@/src/week-context/weeks";

function revalidatePlanWorkflow(): void {
  revalidatePath("/plan");
  revalidatePath("/planner");
  revalidatePath("/shopping-list");
  revalidatePath("/weeks");
  revalidatePath("/");
}

export async function createAndRunPlannerJobForWeekAction(formData: FormData): Promise<void> {
  const weekId = resolveWeekIdFromParam(formData.get("weekId")?.toString());
  if (!weekId) {
    throw new Error("Kalenderwoche fehlt.");
  }

  const db = getDb();
  const job = createPlannerJobForWeek(db, weekId);
  await runPlannerJobWithConfiguredAdapter(db, job.jobId);
  revalidatePlanWorkflow();
}
