"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/src/db/client";
import { buildWeekContextFromFormData } from "@/src/week-context/form";
import { saveCurrentWeekContext } from "@/src/week-context/repository";

export async function saveWeekContextAction(formData: FormData): Promise<void> {
  const context = buildWeekContextFromFormData(formData);
  saveCurrentWeekContext(getDb(), context);
  revalidatePath("/week");
  revalidatePath("/planner");
  revalidatePath("/weeks");
  revalidatePath("/");
}
