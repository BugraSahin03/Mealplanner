"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/src/db/client";
import { buildProfileInputFromFormData, mergeProfileFormInput } from "@/src/profiles/form";
import { getProfile, upsertProfile } from "@/src/profiles/repository";

export async function saveProfileAction(formData: FormData): Promise<void> {
  const input = buildProfileInputFromFormData(formData);
  const db = getDb();
  const existing = getProfile(db, input.personId);
  upsertProfile(db, mergeProfileFormInput(existing, input));
  revalidatePath("/profile");
  revalidatePath("/");
}
