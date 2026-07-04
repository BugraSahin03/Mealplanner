import type { MealContext, MealType, Weekday } from "./repository";

export type PlannerResponseMeal = {
  mealId: string;
  mealType: MealType;
  title: string;
  description?: string;
  people: Array<{
    personId: "bugra" | "sena";
    portion?: "small" | "normal" | "large";
    estimatedKcal?: number;
    estimatedProteinG?: number;
  }>;
  context: MealContext;
  tags?: string[];
  mealPrep?: {
    transportable: boolean;
    makeAhead: boolean;
    reheating?: "none" | "microwave" | "pan" | "oven" | "cold_ok";
    prepNotes?: string;
  };
  estimatedNutrition?: {
    kcal?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  };
  ingredients: Array<{
    name: string;
    amount: number;
    unit: PlannerResponseUnit;
    category?: PlannerResponseShoppingCategory;
    pantryItem?: boolean;
    optional?: boolean;
    notes?: string;
  }>;
  notes?: string;
};

export type PlannerResponseDay = {
  dayId: string;
  date?: string;
  weekday: Weekday;
  meals: PlannerResponseMeal[];
};

export type PlannerResponse = {
  schemaVersion: "1.0";
  plan: {
    title?: string;
    summary?: string;
    days: PlannerResponseDay[];
  };
  shoppingList: Array<{
    name: string;
    amount: number;
    unit: PlannerResponseUnit;
    category?: PlannerResponseShoppingCategory;
    sourceMealIds?: string[];
    pantryItem?: boolean;
    optional?: boolean;
    buyingHint?: string;
    notes?: string;
  }>;
  plannerNotes?: string[];
  warnings?: string[];
};

type PlannerResponseUnit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "piece"
  | "tbsp"
  | "tsp"
  | "pack"
  | "can"
  | "jar"
  | "bottle";

type PlannerResponseShoppingCategory =
  | "produce"
  | "meat_fish"
  | "dairy_eggs"
  | "bakery"
  | "dry_goods"
  | "frozen"
  | "canned"
  | "condiments_spices"
  | "drinks"
  | "other";

const weekdays = new Set<Weekday>([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
const mealTypes = new Set<MealType>(["breakfast", "lunch", "dinner", "snack"]);
const mealContexts = new Set<MealContext>(["office", "home", "shared", "meal_prep", "flex"]);
const personIds = new Set(["bugra", "sena"]);
const units = new Set<PlannerResponseUnit>([
  "g",
  "kg",
  "ml",
  "l",
  "piece",
  "tbsp",
  "tsp",
  "pack",
  "can",
  "jar",
  "bottle",
]);
const shoppingCategories = new Set<PlannerResponseShoppingCategory>([
  "produce",
  "meat_fish",
  "dairy_eggs",
  "bakery",
  "dry_goods",
  "frozen",
  "canned",
  "condiments_spices",
  "drinks",
  "other",
]);
const portions = new Set(["small", "normal", "large"]);
const reheatingOptions = new Set(["none", "microwave", "pan", "oven", "cold_ok"]);

function validateAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: string[],
  path: string,
): string[] {
  const allowed = new Set(allowedKeys);
  return Object.keys(value)
    .filter((key) => !allowed.has(key))
    .map((key) => `${path}.${key} ist nicht erlaubt.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validateOptionalStringArray(value: unknown, path: string): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return [`${path} muss eine Textliste sein.`];
  }
  return [];
}

function validateOptionalBoolean(value: unknown, path: string): string[] {
  if (value !== undefined && typeof value !== "boolean") {
    return [`${path} muss boolean sein.`];
  }
  return [];
}

function validateOptionalNumber(value: unknown, path: string): string[] {
  if (value !== undefined && !isNonNegativeNumber(value)) {
    return [`${path} muss eine positive Zahl sein.`];
  }
  return [];
}

function validateIngredient(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return [`${path} muss ein Objekt sein.`];
  }
  errors.push(
    ...validateAllowedKeys(
      value,
      ["name", "amount", "unit", "category", "pantryItem", "optional", "notes"],
      path,
    ),
  );
  if (!hasText(value.name)) {
    errors.push(`${path}.name fehlt.`);
  }
  if (!isNonNegativeNumber(value.amount)) {
    errors.push(`${path}.amount muss eine positive Zahl sein.`);
  }
  if (!units.has(value.unit as PlannerResponseUnit)) {
    errors.push(`${path}.unit ist ungueltig.`);
  }
  if (value.category !== undefined && !shoppingCategories.has(value.category as PlannerResponseShoppingCategory)) {
    errors.push(`${path}.category ist ungueltig.`);
  }
  errors.push(...validateOptionalBoolean(value.pantryItem, `${path}.pantryItem`));
  errors.push(...validateOptionalBoolean(value.optional, `${path}.optional`));
  if (value.notes !== undefined && typeof value.notes !== "string") {
    errors.push(`${path}.notes muss Text sein.`);
  }
  return errors;
}

function validateShoppingItem(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return [`${path} muss ein Objekt sein.`];
  }
  errors.push(
    ...validateAllowedKeys(
      value,
      [
        "name",
        "amount",
        "unit",
        "category",
        "sourceMealIds",
        "pantryItem",
        "optional",
        "buyingHint",
        "notes",
      ],
      path,
    ),
  );
  errors.push(
    ...validateIngredient(value, path).filter(
      (error) =>
        !error.includes("sourceMealIds")
        && !error.includes("buyingHint")
        && !error.endsWith("ist nicht erlaubt."),
    ),
  );
  errors.push(...validateOptionalStringArray(value.sourceMealIds, `${path}.sourceMealIds`));
  if (value.buyingHint !== undefined && typeof value.buyingHint !== "string") {
    errors.push(`${path}.buyingHint muss Text sein.`);
  }
  return errors;
}

function validateMealPrep(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return [`${path} muss ein Objekt sein.`];
  }
  errors.push(
    ...validateAllowedKeys(value, ["transportable", "makeAhead", "reheating", "prepNotes"], path),
  );
  if (typeof value.transportable !== "boolean") {
    errors.push(`${path}.transportable muss boolean sein.`);
  }
  if (typeof value.makeAhead !== "boolean") {
    errors.push(`${path}.makeAhead muss boolean sein.`);
  }
  if (value.reheating !== undefined && !reheatingOptions.has(value.reheating as string)) {
    errors.push(`${path}.reheating ist ungueltig.`);
  }
  if (value.prepNotes !== undefined && typeof value.prepNotes !== "string") {
    errors.push(`${path}.prepNotes muss Text sein.`);
  }
  return errors;
}

function validateNutrition(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return [`${path} muss ein Objekt sein.`];
  }
  errors.push(...validateAllowedKeys(value, ["kcal", "proteinG", "carbsG", "fatG"], path));
  for (const key of ["kcal", "proteinG", "carbsG", "fatG"]) {
    errors.push(...validateOptionalNumber(value[key], `${path}.${key}`));
  }
  return errors;
}

function validateMeal(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return [`${path} muss ein Objekt sein.`];
  }
  errors.push(
    ...validateAllowedKeys(
      value,
      [
        "mealId",
        "mealType",
        "title",
        "description",
        "people",
        "context",
        "tags",
        "mealPrep",
        "estimatedNutrition",
        "ingredients",
        "notes",
      ],
      path,
    ),
  );
  if (!hasText(value.mealId)) {
    errors.push(`${path}.mealId fehlt.`);
  }
  if (!mealTypes.has(value.mealType as MealType)) {
    errors.push(`${path}.mealType ist ungueltig.`);
  }
  if (!hasText(value.title)) {
    errors.push(`${path}.title fehlt.`);
  }
  if (value.description !== undefined && typeof value.description !== "string") {
    errors.push(`${path}.description muss Text sein.`);
  }
  if (!mealContexts.has(value.context as MealContext)) {
    errors.push(`${path}.context ist ungueltig.`);
  }
  errors.push(...validateOptionalStringArray(value.tags, `${path}.tags`));
  if (value.mealPrep !== undefined) {
    errors.push(...validateMealPrep(value.mealPrep, `${path}.mealPrep`));
  }
  if (value.estimatedNutrition !== undefined) {
    errors.push(...validateNutrition(value.estimatedNutrition, `${path}.estimatedNutrition`));
  }
  if (value.notes !== undefined && typeof value.notes !== "string") {
    errors.push(`${path}.notes muss Text sein.`);
  }
  if (!Array.isArray(value.people) || value.people.length === 0) {
    errors.push(`${path}.people fehlt.`);
  } else {
    value.people.forEach((person, index) => {
      if (!isRecord(person) || !personIds.has(person.personId as string)) {
        errors.push(`${path}.people[${index}].personId ist ungueltig.`);
        return;
      }
      errors.push(
        ...validateAllowedKeys(
          person,
          ["personId", "portion", "estimatedKcal", "estimatedProteinG"],
          `${path}.people[${index}]`,
        ),
      );
      if (person.portion !== undefined && !portions.has(person.portion as string)) {
        errors.push(`${path}.people[${index}].portion ist ungueltig.`);
      }
      errors.push(...validateOptionalNumber(person.estimatedKcal, `${path}.people[${index}].estimatedKcal`));
      errors.push(
        ...validateOptionalNumber(
          person.estimatedProteinG,
          `${path}.people[${index}].estimatedProteinG`,
        ),
      );
    });
  }
  if (!Array.isArray(value.ingredients) || value.ingredients.length === 0) {
    errors.push(`${path}.ingredients fehlt.`);
  } else {
    value.ingredients.forEach((ingredient, index) => {
      errors.push(...validateIngredient(ingredient, `${path}.ingredients[${index}]`));
    });
  }
  return errors;
}

export function validatePlannerResponse(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return ["Planner-Response muss ein Objekt sein."];
  }
  errors.push(
    ...validateAllowedKeys(
      value,
      ["schemaVersion", "plan", "shoppingList", "plannerNotes", "warnings"],
      "response",
    ),
  );
  if (value.schemaVersion !== "1.0") {
    errors.push("schemaVersion muss 1.0 sein.");
  }
  if (!isRecord(value.plan)) {
    errors.push("plan fehlt.");
  } else {
    errors.push(...validateAllowedKeys(value.plan, ["title", "summary", "days"], "plan"));
    if (value.plan.title !== undefined && typeof value.plan.title !== "string") {
      errors.push("plan.title muss Text sein.");
    }
    if (value.plan.summary !== undefined && typeof value.plan.summary !== "string") {
      errors.push("plan.summary muss Text sein.");
    }
    const days = value.plan.days;
    if (!Array.isArray(days) || days.length === 0) {
      errors.push("plan.days fehlt.");
    } else if (days.length > 7) {
      errors.push("plan.days darf maximal sieben Tage enthalten.");
    }
    if (Array.isArray(days)) {
      days.forEach((day, dayIndex) => {
      const path = `plan.days[${dayIndex}]`;
      if (!isRecord(day)) {
        errors.push(`${path} muss ein Objekt sein.`);
        return;
      }
      errors.push(...validateAllowedKeys(day, ["dayId", "date", "weekday", "meals"], path));
      if (!hasText(day.dayId)) {
        errors.push(`${path}.dayId fehlt.`);
      }
      if (day.date !== undefined && typeof day.date !== "string") {
        errors.push(`${path}.date muss Text sein.`);
      }
      if (!weekdays.has(day.weekday as Weekday)) {
        errors.push(`${path}.weekday ist ungueltig.`);
      }
      if (!Array.isArray(day.meals) || day.meals.length === 0) {
        errors.push(`${path}.meals fehlt.`);
      } else {
        day.meals.forEach((meal, mealIndex) => {
          errors.push(...validateMeal(meal, `${path}.meals[${mealIndex}]`));
        });
      }
      });
    }
  }
  if (!Array.isArray(value.shoppingList)) {
    errors.push("shoppingList fehlt.");
  } else {
    value.shoppingList.forEach((item, index) => {
      errors.push(...validateShoppingItem(item, `shoppingList[${index}]`));
    });
  }
  errors.push(...validateOptionalStringArray(value.plannerNotes, "plannerNotes"));
  errors.push(...validateOptionalStringArray(value.warnings, "warnings"));
  return errors;
}

export function assertPlannerResponse(value: unknown): PlannerResponse {
  const errors = validatePlannerResponse(value);
  if (errors.length > 0) {
    throw new Error(`Invalid planner response: ${errors.join(" ")}`);
  }
  return value as PlannerResponse;
}

export function buildDemoPlannerResponse(): PlannerResponse {
  return {
    schemaVersion: "1.0",
    plan: {
      title: "Demo-Wochenplan",
      summary: "Validierter Beispielplan ohne OpenClaw-Aufruf.",
      days: [
        {
          dayId: "demo-monday",
          weekday: "monday",
          meals: [
            {
              mealId: "demo-monday-breakfast",
              mealType: "breakfast",
              title: "Skyr mit Haferflocken",
              people: [{ personId: "bugra" }, { personId: "sena" }],
              context: "home",
              ingredients: [
                { name: "Skyr", amount: 500, unit: "g", category: "dairy_eggs" },
                { name: "Haferflocken", amount: 120, unit: "g", category: "dry_goods" },
              ],
            },
          ],
        },
      ],
    },
    shoppingList: [
      {
        name: "Skyr",
        amount: 500,
        unit: "g",
        category: "dairy_eggs",
        sourceMealIds: ["demo-monday-breakfast"],
      },
      {
        name: "Haferflocken",
        amount: 120,
        unit: "g",
        category: "dry_goods",
        sourceMealIds: ["demo-monday-breakfast"],
      },
    ],
    plannerNotes: ["Demo-Erfolg fuer den Job-Statusfluss."],
  };
}
