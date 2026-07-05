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
    gramsPerPortion?: number;
    estimatedKcalPer100g?: number;
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
  batchPrep?: {
    batchId: string;
    plannedDayIds: string[];
    plannedWeekdays: Weekday[];
    portionCount: number;
    perPersonPortions: Array<{
      personId: "bugra" | "sena";
      portionCount: number;
      gramsPerPortion?: number;
      estimatedKcalPerPortion?: number;
      estimatedKcalPer100g?: number;
    }>;
    notes?: string;
  };
  dinnerLeftovers?: {
    leftoverGroupId: string;
    role: "fresh_cook" | "leftover" | "repeat_serving";
    plannedDayIds: string[];
    plannedWeekdays: Weekday[];
    spanDays: number;
    servingNumber: number;
    totalServings: number;
    notes?: string;
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
  const chickenBatch = {
    batchId: "batch-lunch-chicken-rice",
    plannedDayIds: ["monday", "wednesday", "friday"],
    plannedWeekdays: ["monday", "wednesday", "friday"] as Weekday[],
    portionCount: 6,
    perPersonPortions: [
      {
        personId: "bugra" as const,
        portionCount: 3,
        gramsPerPortion: 450,
        estimatedKcalPerPortion: 720,
        estimatedKcalPer100g: 160,
      },
      {
        personId: "sena" as const,
        portionCount: 3,
        gramsPerPortion: 320,
        estimatedKcalPerPortion: 510,
        estimatedKcalPer100g: 159,
      },
    ],
    notes: "Batch fuer Montag, Mittwoch und Freitag. Unterschiedliche Portionsgroessen einplanen.",
  };
  const lentilBatch = {
    batchId: "batch-lunch-lentil-feta",
    plannedDayIds: ["tuesday", "thursday"],
    plannedWeekdays: ["tuesday", "thursday"] as Weekday[],
    portionCount: 4,
    perPersonPortions: [
      {
        personId: "bugra" as const,
        portionCount: 2,
        gramsPerPortion: 420,
        estimatedKcalPerPortion: 650,
        estimatedKcalPer100g: 155,
      },
      {
        personId: "sena" as const,
        portionCount: 2,
        gramsPerPortion: 300,
        estimatedKcalPerPortion: 460,
        estimatedKcalPer100g: 153,
      },
    ],
    notes: "Kalt essbarer Batch fuer Dienstag und Donnerstag.",
  };
  const dinnerPlans = [
    {
      title: "Bolognese mit Pasta",
      group: {
        leftoverGroupId: "dinner-leftover-bolognese",
        plannedDayIds: ["monday", "tuesday"],
        plannedWeekdays: ["monday", "tuesday"] as Weekday[],
        spanDays: 2,
        totalServings: 2,
        notes: "Montag frisch kochen, Dienstag als zweite Portion aufwaermen.",
      },
      ingredients: [
        { name: "Pasta", amount: 300, unit: "g" as const, category: "dry_goods" as const },
        { name: "Rinderhack", amount: 350, unit: "g" as const, category: "meat_fish" as const },
        { name: "Tomaten", amount: 500, unit: "g" as const, category: "produce" as const },
      ],
    },
    {
      title: "Bolognese mit Pasta",
      group: {
        leftoverGroupId: "dinner-leftover-bolognese",
        plannedDayIds: ["monday", "tuesday"],
        plannedWeekdays: ["monday", "tuesday"] as Weekday[],
        spanDays: 2,
        totalServings: 2,
        notes: "Restetag aus dem Montagstopf.",
      },
      ingredients: [
        { name: "Pasta", amount: 300, unit: "g" as const, category: "dry_goods" as const },
        { name: "Rinderhack", amount: 350, unit: "g" as const, category: "meat_fish" as const },
        { name: "Tomaten", amount: 500, unit: "g" as const, category: "produce" as const },
      ],
    },
    {
      title: "Puten-Chili",
      group: {
        leftoverGroupId: "dinner-leftover-turkey-chili",
        plannedDayIds: ["wednesday", "thursday"],
        plannedWeekdays: ["wednesday", "thursday"] as Weekday[],
        spanDays: 2,
        totalServings: 2,
        notes: "Mittwoch frisch kochen, Donnerstag als Chili-Rest einplanen.",
      },
      ingredients: [
        { name: "Putenhack", amount: 320, unit: "g" as const, category: "meat_fish" as const },
        { name: "Kidneybohnen", amount: 1, unit: "can" as const, category: "canned" as const },
        { name: "Tomaten", amount: 400, unit: "g" as const, category: "produce" as const },
      ],
    },
    {
      title: "Puten-Chili",
      group: {
        leftoverGroupId: "dinner-leftover-turkey-chili",
        plannedDayIds: ["wednesday", "thursday"],
        plannedWeekdays: ["wednesday", "thursday"] as Weekday[],
        spanDays: 2,
        totalServings: 2,
        notes: "Restetag mit gleicher Basis, optional frisch garnieren.",
      },
      ingredients: [
        { name: "Putenhack", amount: 320, unit: "g" as const, category: "meat_fish" as const },
        { name: "Kidneybohnen", amount: 1, unit: "can" as const, category: "canned" as const },
        { name: "Tomaten", amount: 400, unit: "g" as const, category: "produce" as const },
      ],
    },
    {
      title: "Ofengemuese mit Dip",
      group: {
        leftoverGroupId: "dinner-leftover-roasted-veg",
        plannedDayIds: ["friday", "saturday"],
        plannedWeekdays: ["friday", "saturday"] as Weekday[],
        spanDays: 2,
        totalServings: 2,
        notes: "Freitag groesseres Blech vorbereiten, Samstag als Reste-Bowl nutzen.",
      },
      ingredients: [
        { name: "Kartoffeln", amount: 500, unit: "g" as const, category: "dry_goods" as const },
        { name: "Paprika", amount: 3, unit: "piece" as const, category: "produce" as const },
        { name: "Joghurt", amount: 200, unit: "g" as const, category: "dairy_eggs" as const },
      ],
    },
    {
      title: "Ofengemuese mit Dip",
      group: {
        leftoverGroupId: "dinner-leftover-roasted-veg",
        plannedDayIds: ["friday", "saturday"],
        plannedWeekdays: ["friday", "saturday"] as Weekday[],
        spanDays: 2,
        totalServings: 2,
        notes: "Restetag mit frischem Dip.",
      },
      ingredients: [
        { name: "Kartoffeln", amount: 500, unit: "g" as const, category: "dry_goods" as const },
        { name: "Paprika", amount: 3, unit: "piece" as const, category: "produce" as const },
        { name: "Joghurt", amount: 200, unit: "g" as const, category: "dairy_eggs" as const },
      ],
    },
    {
      title: "Tomaten-Pasta mit Salat",
      group: null,
      ingredients: [
        { name: "Pasta", amount: 260, unit: "g" as const, category: "dry_goods" as const },
        { name: "Tomaten", amount: 400, unit: "g" as const, category: "produce" as const },
        { name: "Salat", amount: 1, unit: "piece" as const, category: "produce" as const },
      ],
    },
  ];

  const days: PlannerResponseDay[] = [
    ["monday", "Montag"],
    ["tuesday", "Dienstag"],
    ["wednesday", "Mittwoch"],
    ["thursday", "Donnerstag"],
    ["friday", "Freitag"],
    ["saturday", "Samstag"],
    ["sunday", "Sonntag"],
  ].map(([weekday, label], index) => {
    const dinnerPlan = dinnerPlans[index];
    const dinnerLeftovers = dinnerPlan.group
      ? {
          ...dinnerPlan.group,
          role: index % 2 === 0 ? "fresh_cook" as const : "leftover" as const,
          servingNumber: index % 2 === 0 ? 1 : 2,
        }
      : undefined;

    return {
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
        title: index % 2 === 0 ? "Chicken-Reis-Bowl" : "Linsen-Feta-Salat",
        people: [
          {
            personId: "bugra",
            portion: "large",
            gramsPerPortion: index % 2 === 0 ? 450 : 420,
            estimatedKcal: index % 2 === 0 ? 720 : 650,
            estimatedKcalPer100g: index % 2 === 0 ? 160 : 155,
          },
        ],
        context: index < 5 ? "office" : "home",
        mealPrep: {
          transportable: index < 5,
          makeAhead: true,
          reheating: "microwave",
          prepNotes: index < 5 ? "Transportbox am Vorabend packen." : "Frisch anrichten.",
        },
        ...(index < 5 ? { batchPrep: index % 2 === 0 ? chickenBatch : lentilBatch } : {}),
        ingredients: [
          { name: index % 2 === 0 ? "Haehnchenbrust" : "Linsen", amount: index % 2 === 0 ? 220 : 180, unit: "g", category: index % 2 === 0 ? "meat_fish" : "canned" },
          { name: index % 2 === 0 ? "Reis" : "Feta", amount: index % 2 === 0 ? 120 : 80, unit: "g", category: index % 2 === 0 ? "dry_goods" : "dairy_eggs" },
          { name: "Gemuese-Mix", amount: 180, unit: "g", category: "produce" },
        ],
      },
      {
        mealId: `${weekday}-lunch-sena`,
        mealType: "lunch",
        title: index % 2 === 0 ? "Chicken-Reis-Bowl" : "Linsen-Feta-Salat",
        people: [
          {
            personId: "sena",
            portion: "normal",
            gramsPerPortion: index % 2 === 0 ? 320 : 300,
            estimatedKcal: index % 2 === 0 ? 510 : 460,
            estimatedKcalPer100g: index % 2 === 0 ? 159 : 153,
          },
        ],
        context: index < 5 ? "office" : "home",
        mealPrep: {
          transportable: index < 5,
          makeAhead: true,
          reheating: "cold_ok",
          prepNotes: index < 5 ? "Kalt essbar einpacken." : "Frisch anrichten.",
        },
        ...(index < 5 ? { batchPrep: index % 2 === 0 ? chickenBatch : lentilBatch } : {}),
        ingredients: [
          { name: index % 2 === 0 ? "Haehnchenbrust" : "Linsen", amount: index % 2 === 0 ? 150 : 130, unit: "g", category: index % 2 === 0 ? "meat_fish" : "canned" },
          { name: index % 2 === 0 ? "Reis" : "Feta", amount: index % 2 === 0 ? 85 : 55, unit: "g", category: index % 2 === 0 ? "dry_goods" : "dairy_eggs" },
          { name: "Gemuese-Mix", amount: 150, unit: "g", category: "produce" },
        ],
      },
      {
        mealId: `${weekday}-dinner`,
        mealType: "dinner",
        title: dinnerPlan.title,
        people: [{ personId: "bugra" }, { personId: "sena" }],
        context: "shared",
        ...(dinnerLeftovers ? { dinnerLeftovers } : {}),
        ingredients: dinnerPlan.ingredients,
      },
      ],
    };
  });

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
        amount: 1940,
        unit: "g",
        category: "dairy_eggs",
        sourceMealIds: [
          ...days.map((day) => `${day.weekday}-breakfast-sena`),
          "friday-dinner",
          "saturday-dinner",
        ],
        buyingHint: "Fruehstueck plus Dip fuer das Ofengemuese einplanen.",
      },
      {
        name: "Haferflocken",
        amount: 560,
        unit: "g",
        category: "dry_goods",
        sourceMealIds: days.map((day) => `${day.weekday}-breakfast-bugra`),
      },
      {
        name: "Haehnchenbrust",
        amount: 1110,
        unit: "g",
        category: "meat_fish",
        sourceMealIds: ["monday", "wednesday", "friday"].flatMap((weekday) => [
          `${weekday}-lunch-bugra`,
          `${weekday}-lunch-sena`,
        ]),
        buyingHint: "Fuer drei Chicken-Reis-Bowl-Tage vorbereitet.",
      },
      {
        name: "Reis",
        amount: 615,
        unit: "g",
        category: "dry_goods",
        sourceMealIds: ["monday", "wednesday", "friday"].flatMap((weekday) => [
          `${weekday}-lunch-bugra`,
          `${weekday}-lunch-sena`,
        ]),
      },
      {
        name: "Linsen",
        amount: 620,
        unit: "g",
        category: "canned",
        sourceMealIds: ["tuesday", "thursday"].flatMap((weekday) => [
          `${weekday}-lunch-bugra`,
          `${weekday}-lunch-sena`,
        ]),
        buyingHint: "Abtropfgewicht beachten.",
      },
      {
        name: "Feta",
        amount: 270,
        unit: "g",
        category: "dairy_eggs",
        sourceMealIds: ["tuesday", "thursday"].flatMap((weekday) => [
          `${weekday}-lunch-bugra`,
          `${weekday}-lunch-sena`,
        ]),
      },
      {
        name: "Gemuese-Mix",
        amount: 1650,
        unit: "g",
        category: "produce",
        sourceMealIds: days
          .filter((day) => !["saturday", "sunday"].includes(day.weekday))
          .flatMap((day) => [`${day.weekday}-lunch-bugra`, `${day.weekday}-lunch-sena`]),
        buyingHint: "Menge ist ueber die zwei Lunch-Batches konsolidiert.",
      },
      {
        name: "Pasta",
        amount: 860,
        unit: "g",
        category: "dry_goods",
        sourceMealIds: ["monday-dinner", "tuesday-dinner", "sunday-dinner"],
        buyingHint: "Bolognese ist fuer zwei Abendessen zusammengefasst.",
      },
      {
        name: "Rinderhack",
        amount: 700,
        unit: "g",
        category: "meat_fish",
        sourceMealIds: ["monday-dinner", "tuesday-dinner"],
      },
      {
        name: "Putenhack",
        amount: 640,
        unit: "g",
        category: "meat_fish",
        sourceMealIds: ["wednesday-dinner", "thursday-dinner"],
      },
      {
        name: "Kidneybohnen",
        amount: 2,
        unit: "can",
        category: "canned",
        sourceMealIds: ["wednesday-dinner", "thursday-dinner"],
      },
      {
        name: "Tomaten",
        amount: 2200,
        unit: "g",
        category: "produce",
        sourceMealIds: [
          "monday-dinner",
          "tuesday-dinner",
          "wednesday-dinner",
          "thursday-dinner",
          "sunday-dinner",
        ],
        buyingHint: "Dinner-Mengen fuer Bolognese, Chili und Sonntags-Pasta konsolidiert.",
      },
      {
        name: "Kartoffeln",
        amount: 1000,
        unit: "g",
        category: "dry_goods",
        sourceMealIds: ["friday-dinner", "saturday-dinner"],
      },
      {
        name: "Paprika",
        amount: 6,
        unit: "piece",
        category: "produce",
        sourceMealIds: ["friday-dinner", "saturday-dinner"],
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
