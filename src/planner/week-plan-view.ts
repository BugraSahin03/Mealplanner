import { groupShoppingListItems, type ShoppingListGroupView } from "../shopping-list/grouping";
import { assertPlannerResponse, type PlannerResponse } from "./response";
import type { MealContext, MealType, Weekday } from "./repository";

export type MealPersonView = {
  personId: "bugra" | "sena";
  label: string;
  portion: string | null;
  gramsPerPortion: number | null;
  estimatedKcal: number | null;
  estimatedKcalPer100g: number | null;
};

export type MealIngredientView = {
  name: string;
  amount: string;
  notes: string | null;
  pantryItem: boolean;
  optional: boolean;
};

export type MealCalorieFactView = {
  label: string | null;
  kcal: string | null;
  grams: string | null;
  kcalPer100G: string | null;
};

export type MealView = {
  mealId: string;
  mealType: MealType;
  slotLabel: string;
  title: string;
  contextLabel: string;
  people: MealPersonView[];
  peopleSummary: string;
  personTheme: "bugra" | "sena" | "shared";
  isPersonalMeal: boolean;
  isSharedDinner: boolean;
  ingredientSummary: string;
  ingredients: MealIngredientView[];
  calorieSummary: string | null;
  calorieFacts: MealCalorieFactView[];
  mealPrepSummary: string | null;
  portionSummary: string | null;
  notes: string | null;
};

export type LunchBatchDishView = {
  batchId: string;
  title: string;
  daysSummary: string;
  peopleSummary: string;
  portionSummary: string;
  notes: string | null;
};

export type DayPlanView = {
  dayId: string;
  weekday: Weekday;
  label: string;
  date: string | null;
  meals: MealView[];
};

export type WeekPlanView = {
  title: string;
  summary: string | null;
  days: DayPlanView[];
  lunchBatchDishes: LunchBatchDishView[];
  shoppingGroups: ShoppingListGroupView[];
  plannerNotes: string[];
  warnings: string[];
};

const weekdays: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const weekdayLabels: Record<Weekday, string> = {
  monday: "Montag",
  tuesday: "Dienstag",
  wednesday: "Mittwoch",
  thursday: "Donnerstag",
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag",
};

const weekdayShortLabels: Record<Weekday, string> = {
  monday: "Mo",
  tuesday: "Di",
  wednesday: "Mi",
  thursday: "Do",
  friday: "Fr",
  saturday: "Sa",
  sunday: "So",
};

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
  snack: "Snack",
};

const contextLabels: Record<MealContext, string> = {
  office: "Office",
  home: "Home",
  shared: "Gemeinsam",
  meal_prep: "Meal Prep",
  flex: "Flex",
};

const personLabels: Record<"bugra" | "sena", string> = {
  bugra: "Buğra",
  sena: "Sena",
};

const portionLabels: Record<"small" | "normal" | "large", string> = {
  small: "klein",
  normal: "normal",
  large: "groß",
};

const unitLabels: Record<PlannerResponse["shoppingList"][number]["unit"], string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  piece: "Stk.",
  tbsp: "EL",
  tsp: "TL",
  pack: "Packung",
  can: "Dose",
  jar: "Glas",
  bottle: "Flasche",
};

function formatDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T00:00:00Z`));
}

function buildPeopleSummary(people: MealPersonView[], context: MealContext): string {
  if (context === "shared" && people.length > 1) {
    return "Gemeinsam";
  }

  return people.map((person) => person.label).join(", ");
}

function buildIngredientSummary(meal: PlannerResponse["plan"]["days"][number]["meals"][number]): string {
  return meal.ingredients
    .slice(0, 3)
    .map((ingredient) => ingredient.name)
    .join(", ");
}

function formatAmount(amount: number, unit: PlannerResponse["shoppingList"][number]["unit"]): string {
  const formattedAmount = Number.isInteger(amount)
    ? String(amount)
    : new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(amount);

  return `${formattedAmount} ${unitLabels[unit]}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value);
}

function stripWeekdayTitlePrefix(title: string): string {
  return title.replace(
    /^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag):\s*/u,
    "",
  );
}

function buildPortionSummary(people: MealPersonView[]): string | null {
  const summaries = people
    .map((person) => {
      const details = [
        person.gramsPerPortion ? `${person.gramsPerPortion} g` : null,
        person.estimatedKcal ? `ca. ${person.estimatedKcal} kcal` : null,
      ].filter(Boolean);

      return details.length > 0 ? `${person.label}: ${details.join(", ")}` : null;
    })
    .filter(Boolean);

  return summaries.length > 0 ? summaries.join(" | ") : null;
}

function buildCalorieSummaryFromPeople(people: MealPersonView[]): string | null {
  const peopleWithCalories = people.filter((person) => person.estimatedKcal);

  const personLines = peopleWithCalories.map((person) => {
    const portion = person.gramsPerPortion ? ` pro ${formatNumber(person.gramsPerPortion)} g Portion` : "";
    const personSuffix = peopleWithCalories.length > 1 ? ` für ${person.label}` : "";
    return `ca. ${formatNumber(person.estimatedKcal ?? 0)} kcal${portion}${personSuffix}`;
  });

  return personLines.length > 0 ? personLines.join(" / ") : null;
}

function buildCalorieSummary(
  meal: PlannerResponse["plan"]["days"][number]["meals"][number],
  people: MealPersonView[],
): string | null {
  const peopleSummary = buildCalorieSummaryFromPeople(people);

  if (peopleSummary) {
    return peopleSummary;
  }

  if (meal.estimatedNutrition?.kcalPer100G) {
    return `ca. ${formatNumber(meal.estimatedNutrition.kcalPer100G)} kcal pro 100 g`;
  }

  if (meal.estimatedNutrition?.kcal) {
    return `ca. ${formatNumber(meal.estimatedNutrition.kcal)} kcal pro Gericht`;
  }

  return null;
}

function formatKcalPer100G(kcal: number, grams: number): string | null {
  if (grams <= 0) {
    return null;
  }

  return `ca. ${formatNumber((kcal / grams) * 100)}`;
}

function buildCalorieFacts(
  meal: PlannerResponse["plan"]["days"][number]["meals"][number],
  people: MealPersonView[],
): MealCalorieFactView[] {
  const peopleWithFacts = people.filter(
    (person) => person.estimatedKcal || person.gramsPerPortion || person.estimatedKcalPer100g,
  );

  if (peopleWithFacts.length > 0) {
    return peopleWithFacts.map((person) => ({
      label: peopleWithFacts.length > 1 ? person.label : null,
      kcal: person.estimatedKcal ? `ca. ${formatNumber(person.estimatedKcal)}` : null,
      grams: person.gramsPerPortion ? formatNumber(person.gramsPerPortion) : null,
      kcalPer100G: person.estimatedKcalPer100g
        ? `ca. ${formatNumber(person.estimatedKcalPer100g)}`
        : person.estimatedKcal && person.gramsPerPortion
          ? formatKcalPer100G(person.estimatedKcal, person.gramsPerPortion)
          : meal.estimatedNutrition?.kcalPer100G
            ? `ca. ${formatNumber(meal.estimatedNutrition.kcalPer100G)}`
            : null,
    }));
  }

  if (meal.estimatedNutrition?.kcalPer100G || meal.estimatedNutrition?.kcal) {
    return [
      {
        label: null,
        kcal: meal.estimatedNutrition.kcal ? `ca. ${formatNumber(meal.estimatedNutrition.kcal)}` : null,
        grams: null,
        kcalPer100G: meal.estimatedNutrition.kcalPer100G
          ? `ca. ${formatNumber(meal.estimatedNutrition.kcalPer100G)}`
          : null,
      },
    ];
  }

  return [];
}

function getPersonTheme(people: MealPersonView[]): MealView["personTheme"] {
  if (people.length === 1) {
    return people[0]?.personId ?? "shared";
  }

  return "shared";
}

function buildMealPrepSummary(meal: PlannerResponse["plan"]["days"][number]["meals"][number]): string | null {
  if (!meal.mealPrep) {
    return null;
  }

  const transport = meal.mealPrep.transportable ? "transportierbar" : "nicht transportierbar";
  const timing = meal.mealPrep.makeAhead ? "vorbereitbar" : "frisch einplanen";
  const reheating = meal.mealPrep.reheating ? `Aufwärmen: ${meal.mealPrep.reheating}` : null;

  return [transport, timing, reheating, meal.mealPrep.prepNotes ?? null].filter(Boolean).join(" · ");
}

function readGramsPerPortion(person: PlannerResponse["plan"]["days"][number]["meals"][number]["people"][number]): number | null {
  return person.gramsPerPortion ?? person.portionGrams ?? null;
}

function mapMeal(meal: PlannerResponse["plan"]["days"][number]["meals"][number]): MealView {
  const people = meal.people.map<MealPersonView>((person) => ({
    personId: person.personId,
    label: personLabels[person.personId],
    portion: person.portion ? portionLabels[person.portion] : null,
    gramsPerPortion: readGramsPerPortion(person),
    estimatedKcal: person.estimatedKcal ?? null,
    estimatedKcalPer100g: person.estimatedKcalPer100g ?? null,
  }));

  return {
    mealId: meal.mealId,
    mealType: meal.mealType,
    slotLabel: mealTypeLabels[meal.mealType],
    title: stripWeekdayTitlePrefix(meal.title),
    contextLabel: contextLabels[meal.context],
    people,
    peopleSummary: buildPeopleSummary(people, meal.context),
    personTheme: getPersonTheme(people),
    isPersonalMeal: people.length === 1 && meal.mealType !== "dinner",
    isSharedDinner: meal.mealType === "dinner" && meal.context === "shared" && people.length > 1,
    ingredientSummary: buildIngredientSummary(meal),
    ingredients: meal.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: formatAmount(ingredient.amount, ingredient.unit),
      notes: ingredient.notes ?? null,
      pantryItem: ingredient.pantryItem ?? false,
      optional: ingredient.optional ?? false,
    })),
    calorieSummary: buildCalorieSummary(meal, people),
    calorieFacts: buildCalorieFacts(meal, people),
    mealPrepSummary: buildMealPrepSummary(meal),
    portionSummary: buildPortionSummary(people),
    notes: meal.notes ?? meal.mealPrep?.prepNotes ?? null,
  };
}

function buildLunchBatchDishes(plannerResponse: PlannerResponse): LunchBatchDishView[] {
  const batches = new Map<string, LunchBatchDishView>();

  for (const day of plannerResponse.plan.days) {
    for (const meal of day.meals) {
      if (meal.mealType !== "lunch" || !meal.batchPrep || batches.has(meal.batchPrep.batchId)) {
        continue;
      }

      const portionSummary = meal.batchPrep.perPersonPortions
        .map((portion) => {
          const details = [
            `${portion.portionCount} Portion(en)`,
            portion.gramsPerPortion ? `${portion.gramsPerPortion} g` : null,
            portion.estimatedKcalPerPortion ? `ca. ${portion.estimatedKcalPerPortion} kcal` : null,
          ].filter(Boolean);

          return `${personLabels[portion.personId]}: ${details.join(", ")}`;
        })
        .join(" | ");

      batches.set(meal.batchPrep.batchId, {
        batchId: meal.batchPrep.batchId,
        title: meal.title,
        daysSummary: meal.batchPrep.plannedWeekdays.map((weekday) => weekdayShortLabels[weekday]).join(", "),
        peopleSummary: meal.batchPrep.perPersonPortions
          .map((portion) => personLabels[portion.personId])
          .join(", "),
        portionSummary,
        notes: meal.batchPrep.notes ?? null,
      });
    }
  }

  return [...batches.values()];
}

export function buildWeekPlanView(response: unknown): WeekPlanView {
  const plannerResponse = assertPlannerResponse(response);
  const daysByWeekday = new Map(plannerResponse.plan.days.map((day) => [day.weekday, day]));

  return {
    title: plannerResponse.plan.title ?? "Wochenplan",
    summary: plannerResponse.plan.summary ?? null,
    days: weekdays.map((weekday) => {
      const day = daysByWeekday.get(weekday);

      return {
        dayId: day?.dayId ?? weekday,
        weekday,
        label: weekdayLabels[weekday],
        date: formatDate(day?.date),
        meals: day?.meals.map(mapMeal) ?? [],
      };
    }),
    lunchBatchDishes: buildLunchBatchDishes(plannerResponse),
    shoppingGroups: groupShoppingListItems(plannerResponse.shoppingList),
    plannerNotes: plannerResponse.plannerNotes ?? [],
    warnings: plannerResponse.warnings ?? [],
  };
}
