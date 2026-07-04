import { assertPlannerResponseAgainstSchema, validatePlannerResponseAgainstSchema } from "./schema-validation";
import type { MealContext, MealType, Weekday } from "./repository";

export type PlannerResponseUnit =
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

export type PlannerResponseShoppingCategory =
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

export function validatePlannerResponse(value: unknown): string[] {
  return validatePlannerResponseAgainstSchema(value);
}

export function assertPlannerResponse(value: unknown): PlannerResponse {
  return assertPlannerResponseAgainstSchema(value);
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
