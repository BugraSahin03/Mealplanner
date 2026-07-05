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
  const days: PlannerResponseDay[] = [
    ["monday", "Montag"],
    ["tuesday", "Dienstag"],
    ["wednesday", "Mittwoch"],
    ["thursday", "Donnerstag"],
    ["friday", "Freitag"],
    ["saturday", "Samstag"],
    ["sunday", "Sonntag"],
  ].map(([weekday, label], index) => ({
    dayId: weekday,
    weekday: weekday as PlannerResponseDay["weekday"],
    meals: [
      {
        mealId: `${weekday}-breakfast-bugra`,
        mealType: "breakfast",
        title: `${label}: Protein-Skyr`,
        people: [{ personId: "bugra", portion: "large" }],
        context: index < 5 ? "meal_prep" : "home",
        ingredients: [
          { name: "Skyr", amount: 300, unit: "g", category: "dairy_eggs" },
          { name: "Haferflocken", amount: 80, unit: "g", category: "dry_goods" },
          { name: "Beeren", amount: 100, unit: "g", category: "frozen" },
        ],
      },
      {
        mealId: `${weekday}-breakfast-sena`,
        mealType: "breakfast",
        title: `${label}: Joghurt-Bowl`,
        people: [{ personId: "sena", portion: "normal" }],
        context: index < 5 ? "meal_prep" : "home",
        ingredients: [
          { name: "Joghurt", amount: 220, unit: "g", category: "dairy_eggs" },
          { name: "Granola", amount: 45, unit: "g", category: "dry_goods" },
          { name: "Beeren", amount: 80, unit: "g", category: "frozen" },
        ],
      },
      {
        mealId: `${weekday}-lunch-bugra`,
        mealType: "lunch",
        title: index % 2 === 0 ? "Chicken-Reis-Bowl" : "Puten-Reis-Box",
        people: [{ personId: "bugra", portion: "large" }],
        context: index < 5 ? "office" : "home",
        mealPrep: {
          transportable: index < 5,
          makeAhead: true,
          reheating: "microwave",
          prepNotes: index < 5 ? "Transportbox am Vorabend packen." : "Frisch anrichten.",
        },
        ingredients: [
          { name: index % 2 === 0 ? "Haehnchenbrust" : "Putenbrust", amount: 220, unit: "g", category: "meat_fish" },
          { name: "Reis", amount: 120, unit: "g", category: "dry_goods" },
          { name: "Gemuese-Mix", amount: 180, unit: "g", category: "produce" },
        ],
      },
      {
        mealId: `${weekday}-lunch-sena`,
        mealType: "lunch",
        title: index % 2 === 0 ? "Linsen-Feta-Salat" : "Hummus-Gemuese-Wrap",
        people: [{ personId: "sena", portion: "normal" }],
        context: index < 5 ? "office" : "home",
        mealPrep: {
          transportable: index < 5,
          makeAhead: true,
          reheating: "cold_ok",
          prepNotes: index < 5 ? "Kalt essbar einpacken." : "Frisch anrichten.",
        },
        ingredients: [
          { name: index % 2 === 0 ? "Linsen" : "Wrap", amount: index % 2 === 0 ? 180 : 1, unit: index % 2 === 0 ? "g" : "piece", category: index % 2 === 0 ? "canned" : "bakery" },
          { name: index % 2 === 0 ? "Feta" : "Hummus", amount: index % 2 === 0 ? 80 : 70, unit: "g", category: index % 2 === 0 ? "dairy_eggs" : "other" },
          { name: "Gemuese-Mix", amount: 150, unit: "g", category: "produce" },
        ],
      },
      {
        mealId: `${weekday}-dinner`,
        mealType: "dinner",
        title: index % 3 === 0 ? "Tomaten-Pasta mit Salat" : index % 3 === 1 ? "Ofengemuese mit Dip" : "Puten-Chili",
        people: [{ personId: "bugra" }, { personId: "sena" }],
        context: "shared",
        ingredients: [
          { name: index % 3 === 0 ? "Pasta" : index % 3 === 1 ? "Kartoffeln" : "Putenhack", amount: 300, unit: "g", category: index % 3 === 2 ? "meat_fish" : "dry_goods" },
          { name: "Tomaten", amount: 400, unit: "g", category: "produce" },
          { name: "Salat", amount: 1, unit: "piece", category: "produce" },
        ],
      },
    ],
  }));

  return {
    schemaVersion: "1.0",
    plan: {
      title: "Demo-Wochenplan",
      summary: "Validierter Beispielplan fuer eine komplette Woche ohne OpenClaw-Aufruf.",
      days,
    },
    shoppingList: [
      {
        name: "Skyr",
        amount: 2100,
        unit: "g",
        category: "dairy_eggs",
        sourceMealIds: days.map((day) => `${day.weekday}-breakfast-bugra`),
        buyingHint: "Mehrere grosse Becher kaufen.",
      },
      {
        name: "Joghurt",
        amount: 1540,
        unit: "g",
        category: "dairy_eggs",
        sourceMealIds: days.map((day) => `${day.weekday}-breakfast-sena`),
      },
      {
        name: "Haferflocken",
        amount: 560,
        unit: "g",
        category: "dry_goods",
        sourceMealIds: days.map((day) => `${day.weekday}-breakfast-bugra`),
      },
      {
        name: "Gemuese-Mix",
        amount: 2310,
        unit: "g",
        category: "produce",
        sourceMealIds: days.flatMap((day) => [`${day.weekday}-lunch-bugra`, `${day.weekday}-lunch-sena`]),
        buyingHint: "Frisches und TK-Gemuese kombinieren.",
      },
      {
        name: "Olivenoel",
        amount: 1,
        unit: "bottle",
        category: "condiments_spices",
        pantryItem: true,
        optional: true,
        buyingHint: "Nur kaufen, wenn der Vorrat leer ist.",
      },
    ],
    plannerNotes: ["Demo-Erfolg fuer den Job-Statusfluss."],
  };
}
