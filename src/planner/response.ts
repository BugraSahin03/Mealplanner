import type { MealContext, MealType, Weekday } from "./repository";

export type PlannerResponseMeal = {
  mealId: string;
  mealType: MealType;
  title: string;
  people: Array<{ personId: "bugra" | "sena"; portion?: string }>;
  context: MealContext;
  ingredients: Array<{ name: string; amount: number; unit: string; category?: string }>;
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
    unit: string;
    category?: string;
    sourceMealIds?: string[];
    pantryItem?: boolean;
    optional?: boolean;
    buyingHint?: string;
    notes?: string;
  }>;
  plannerNotes?: string[];
  warnings?: string[];
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validateIngredient(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return [`${path} muss ein Objekt sein.`];
  }
  if (!hasText(value.name)) {
    errors.push(`${path}.name fehlt.`);
  }
  if (!isNonNegativeNumber(value.amount)) {
    errors.push(`${path}.amount muss eine positive Zahl sein.`);
  }
  if (!hasText(value.unit)) {
    errors.push(`${path}.unit fehlt.`);
  }
  return errors;
}

function validateMeal(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return [`${path} muss ein Objekt sein.`];
  }
  if (!hasText(value.mealId)) {
    errors.push(`${path}.mealId fehlt.`);
  }
  if (!mealTypes.has(value.mealType as MealType)) {
    errors.push(`${path}.mealType ist ungueltig.`);
  }
  if (!hasText(value.title)) {
    errors.push(`${path}.title fehlt.`);
  }
  if (!mealContexts.has(value.context as MealContext)) {
    errors.push(`${path}.context ist ungueltig.`);
  }
  if (!Array.isArray(value.people) || value.people.length === 0) {
    errors.push(`${path}.people fehlt.`);
  } else {
    value.people.forEach((person, index) => {
      if (!isRecord(person) || !personIds.has(person.personId as string)) {
        errors.push(`${path}.people[${index}].personId ist ungueltig.`);
      }
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
  if (value.schemaVersion !== "1.0") {
    errors.push("schemaVersion muss 1.0 sein.");
  }
  if (!isRecord(value.plan)) {
    errors.push("plan fehlt.");
  } else if (!Array.isArray(value.plan.days) || value.plan.days.length === 0) {
    errors.push("plan.days fehlt.");
  } else {
    value.plan.days.forEach((day, dayIndex) => {
      const path = `plan.days[${dayIndex}]`;
      if (!isRecord(day)) {
        errors.push(`${path} muss ein Objekt sein.`);
        return;
      }
      if (!hasText(day.dayId)) {
        errors.push(`${path}.dayId fehlt.`);
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
  if (!Array.isArray(value.shoppingList)) {
    errors.push("shoppingList fehlt.");
  } else {
    value.shoppingList.forEach((item, index) => {
      errors.push(...validateIngredient(item, `shoppingList[${index}]`));
    });
  }
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
