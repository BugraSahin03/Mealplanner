export type PersonId = "bugra" | "sena";

export type PrimaryGoal =
  | "muscle_gain"
  | "weight_gain"
  | "fat_loss"
  | "weight_loss"
  | "maintenance";

export type ProfilePreferences = {
  favoriteMeals: string[];
  likedIngredients: string[];
  dislikedIngredients: string[];
  likedCuisines: string[];
  dislikedCuisines: string[];
  notes: string;
};

export type MealGuidance = {
  breakfast: string;
  lunch: string;
  dinner: string;
  officeDay: string;
  homeOfficeDay: string;
  mealPrep: string;
};

export type Profile = {
  personId: PersonId;
  displayName: string;
  primaryGoal: PrimaryGoal;
  dailyCaloriesTarget: number | null;
  preferences: ProfilePreferences;
  mealGuidance: MealGuidance;
  hardRules: string[];
  softRules: string[];
  profileNotesMarkdown: string | null;
};

export type ProfileInput = Profile;

export const primaryGoalLabels: Record<PrimaryGoal, string> = {
  muscle_gain: "Muskelaufbau",
  weight_gain: "Gewichtszunahme",
  fat_loss: "Fettverlust",
  weight_loss: "Gewichtsabnahme",
  maintenance: "Gewicht halten",
};

export const primaryGoalOptions = Object.entries(primaryGoalLabels).map(
  ([value, label]) => ({
    value: value as PrimaryGoal,
    label,
  }),
);

export const emptyPreferences: ProfilePreferences = {
  favoriteMeals: [],
  likedIngredients: [],
  dislikedIngredients: [],
  likedCuisines: [],
  dislikedCuisines: [],
  notes: "",
};

export const emptyMealGuidance: MealGuidance = {
  breakfast: "",
  lunch: "",
  dinner: "",
  officeDay: "",
  homeOfficeDay: "",
  mealPrep: "",
};

const personIds = new Set<PersonId>(["bugra", "sena"]);
const primaryGoals = new Set<PrimaryGoal>([
  "muscle_gain",
  "weight_gain",
  "fat_loss",
  "weight_loss",
  "maintenance",
]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readStringArray(
  value: unknown,
  fallback: string[] = [],
): string[] {
  return isStringArray(value) ? value : fallback;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizePreferences(value: unknown): ProfilePreferences {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    favoriteMeals: readStringArray(input.favoriteMeals),
    likedIngredients: readStringArray(input.likedIngredients),
    dislikedIngredients: readStringArray(input.dislikedIngredients),
    likedCuisines: readStringArray(input.likedCuisines),
    dislikedCuisines: readStringArray(input.dislikedCuisines),
    notes: readString(input.notes),
  };
}

export function normalizeMealGuidance(value: unknown): MealGuidance {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    breakfast: readString(input.breakfast),
    lunch: readString(input.lunch),
    dinner: readString(input.dinner),
    officeDay: readString(input.officeDay),
    homeOfficeDay: readString(input.homeOfficeDay),
    mealPrep: readString(input.mealPrep),
  };
}

export function validateProfileInput(profile: ProfileInput): string[] {
  const errors: string[] = [];

  if (!personIds.has(profile.personId)) {
    errors.push("personId muss bugra oder sena sein.");
  }

  if (!profile.displayName.trim()) {
    errors.push("displayName darf nicht leer sein.");
  }

  if (!primaryGoals.has(profile.primaryGoal)) {
    errors.push("primaryGoal ist ungueltig.");
  }

  if (
    profile.dailyCaloriesTarget !== null
    && (!Number.isInteger(profile.dailyCaloriesTarget) || profile.dailyCaloriesTarget < 0)
  ) {
    errors.push("dailyCaloriesTarget muss leer oder eine positive Ganzzahl sein.");
  }

  for (const [field, list] of Object.entries({
    favoriteMeals: profile.preferences.favoriteMeals,
    likedIngredients: profile.preferences.likedIngredients,
    dislikedIngredients: profile.preferences.dislikedIngredients,
    likedCuisines: profile.preferences.likedCuisines,
    dislikedCuisines: profile.preferences.dislikedCuisines,
    hardRules: profile.hardRules,
    softRules: profile.softRules,
  })) {
    if (!isStringArray(list)) {
      errors.push(`${field} muss eine Textliste sein.`);
    }
  }

  return errors;
}
