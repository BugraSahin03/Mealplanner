import {
  emptyMealGuidance,
  emptyPreferences,
  type PersonId,
  type PrimaryGoal,
  type Profile,
  type ProfileInput,
} from "./model";

export function textToList(value: FormDataEntryValue | string | null): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listToText(values: string[]): string {
  return values.join("\n");
}

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalCalories(formData: FormData): number | null {
  const value = readString(formData, "dailyCaloriesTarget");
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function readPersonId(formData: FormData): PersonId {
  const value = readString(formData, "personId");
  if (value !== "bugra" && value !== "sena") {
    throw new Error("Ungueltiges Profil.");
  }

  return value;
}

function readPrimaryGoal(formData: FormData): PrimaryGoal {
  const value = readString(formData, "primaryGoal");
  if (
    value !== "muscle_gain"
    && value !== "weight_gain"
    && value !== "fat_loss"
    && value !== "weight_loss"
    && value !== "maintenance"
  ) {
    throw new Error("Ungueltiges Ziel.");
  }

  return value;
}

export function profileToFormDefaults(profile: Profile): Record<string, string> {
  return {
    favoriteMeals: listToText(profile.preferences.favoriteMeals),
    likedIngredients: listToText(profile.preferences.likedIngredients),
    dislikedIngredients: listToText(profile.preferences.dislikedIngredients),
    breakfast: profile.mealGuidance.breakfast,
    lunch: profile.mealGuidance.lunch,
    dinner: profile.mealGuidance.dinner,
    notes: profile.preferences.notes,
  };
}

export function buildProfileInputFromFormData(formData: FormData): ProfileInput {
  const dailyCaloriesTarget = readOptionalCalories(formData);

  return {
    personId: readPersonId(formData),
    displayName: readString(formData, "displayName"),
    primaryGoal: readPrimaryGoal(formData),
    dailyCaloriesTarget,
    preferences: {
      ...emptyPreferences,
      favoriteMeals: textToList(formData.get("favoriteMeals")),
      likedIngredients: textToList(formData.get("likedIngredients")),
      dislikedIngredients: textToList(formData.get("dislikedIngredients")),
      notes: readString(formData, "notes"),
    },
    mealGuidance: {
      ...emptyMealGuidance,
      breakfast: readString(formData, "breakfast"),
      lunch: readString(formData, "lunch"),
      dinner: readString(formData, "dinner"),
    },
    hardRules: [],
    softRules: textToList(formData.get("softRules")),
    profileNotesMarkdown: null,
  };
}
