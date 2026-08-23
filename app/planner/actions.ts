"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { getDb } from "@/src/db/client";
import {
  createPlannerJobForWeek,
  runPlannerJobWithConfiguredAdapter,
  runLatestPlannerJobWithConfiguredAdapter,
} from "@/src/planner/job-flow";
import { replaceDinnerPairForWeek } from "@/src/planner/dinner-replacement-flow";
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

export type DinnerReplacementActionResult = {
  status: "started" | "error";
  message: string;
};

export async function replaceDinnerPairAction(
  weekIdInput: string,
  leftoverGroupId: string,
): Promise<DinnerReplacementActionResult> {
  const weekId = resolveWeekIdFromParam(weekIdInput);
  if (!weekId || !leftoverGroupId.trim()) {
    return { status: "error", message: "Das Dinner-Paar konnte nicht bestimmt werden." };
  }

  try {
    after(async () => {
      try {
        await replaceDinnerPairForWeek(getDb(), weekId, leftoverGroupId);
        revalidatePlannerViews();
      } catch (error) {
        console.error("Dinner replacement failed.", error);
      }
    });
    return {
      status: "started",
      message: "Der Austausch läuft im Hintergrund. Du kannst die Seite verlassen.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Das Dinner-Paar konnte nicht ersetzt werden.",
    };
  }
}
