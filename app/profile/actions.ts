"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/src/db/client";
import { buildProfileInputFromFormData } from "@/src/profiles/form";
import { upsertProfile } from "@/src/profiles/repository";

export async function saveProfileAction(formData: FormData): Promise<void> {
  const input = buildProfileInputFromFormData(formData);
  upsertProfile(getDb(), input);
  revalidatePath("/profile");
  revalidatePath("/");
}
