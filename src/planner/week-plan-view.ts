import { groupShoppingListItems, type ShoppingListGroupView } from "../shopping-list/grouping";
import { assertPlannerResponse, type PlannerResponse } from "./response";
import type { MealContext, MealType, Weekday } from "./repository";

export type MealPersonView = {
  personId: "bugra" | "sena";
  label: string;
  portion: string | null;
  portionGrams: number | null;
  estimatedKcal: number | null;
  detailLine: string;
};

export type MealIngredientView = {
  name: string;
  amount: string;
  notes: string | null;
  pantryItem: boolean;
  optional: boolean;
};

export type MealView = {
  mealId: string;
  mealType: MealType;
  slotLabel: string;
  title: string;
  contextLabel: string;
  people: MealPersonView[];
  peopleSummary: string;
  isPersonalMeal: boolean;
  isSharedDinner: boolean;
  ingredientSummary: string;
  ingredients: MealIngredientView[];
  calorieSummary: string | null;
  mealPrepSummary: string | null;
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

function buildPersonDetailLine(person: MealPersonView): string {
  const details = [
    person.estimatedKcal ? `ca. ${formatNumber(person.estimatedKcal)} kcal` : null,
    person.portionGrams ? `pro ${formatNumber(person.portionGrams)} g Portion` : null,
    person.portion ? `Portion: ${person.portion}` : null,
  ].filter(Boolean);

  return details.length > 0 ? `${details.join(" · ")} für ${person.label}` : person.label;
}

function buildCalorieSummary(meal: PlannerResponse["plan"]["days"][number]["meals"][number]): string | null {
  const personLines = meal.people
    .filter((person) => person.estimatedKcal)
    .map((person) => {
      const label = personLabels[person.personId];
      const portion = person.portionGrams ? ` pro ${formatNumber(person.portionGrams)} g Portion` : "";
      return `ca. ${formatNumber(person.estimatedKcal ?? 0)} kcal${portion} für ${label}`;
    });

  if (personLines.length > 0) {
    return personLines.join(" / ");
  }

  if (meal.estimatedNutrition?.kcalPer100G) {
    return `ca. ${formatNumber(meal.estimatedNutrition.kcalPer100G)} kcal pro 100 g`;
  }

  if (meal.estimatedNutrition?.kcal) {
    return `ca. ${formatNumber(meal.estimatedNutrition.kcal)} kcal pro Gericht`;
  }

  return null;
}

function buildMealPrepSummary(meal: PlannerResponse["plan"]["days"][number]["meals"][number]): string | null {
  if (!meal.mealPrep) {
    return null;
  }

  const transport = meal.mealPrep.transportable ? "transportierbar" : "nicht transportierbar";
  const timing = meal.mealPrep.makeAhead ? "vorbereitbar" : "frisch einplanen";
  const reheating = meal.mealPrep.reheating ? `Aufwaermen: ${meal.mealPrep.reheating}` : null;

  return [transport, timing, reheating, meal.mealPrep.prepNotes ?? null].filter(Boolean).join(" · ");
}

function mapMeal(
  meal: PlannerResponse["plan"]["days"][number]["meals"][number],
): MealView {
  const people = meal.people.map<MealPersonView>((person) => ({
    personId: person.personId,
    label: personLabels[person.personId],
    portion: person.portion ? portionLabels[person.portion] : null,
    portionGrams: person.portionGrams ?? null,
    estimatedKcal: person.estimatedKcal ?? null,
    detailLine: "",
  }));

  const peopleWithDetails = people.map((person) => ({
    ...person,
    detailLine: buildPersonDetailLine(person),
  }));

  return {
    mealId: meal.mealId,
    mealType: meal.mealType,
    slotLabel: mealTypeLabels[meal.mealType],
    title: meal.title,
    contextLabel: contextLabels[meal.context],
    people: peopleWithDetails,
    peopleSummary: buildPeopleSummary(peopleWithDetails, meal.context),
    isPersonalMeal: peopleWithDetails.length === 1 && meal.mealType !== "dinner",
    isSharedDinner: meal.mealType === "dinner" && meal.context === "shared" && peopleWithDetails.length > 1,
    ingredientSummary: buildIngredientSummary(meal),
    ingredients: meal.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: formatAmount(ingredient.amount, ingredient.unit),
      notes: ingredient.notes ?? null,
      pantryItem: ingredient.pantryItem ?? false,
      optional: ingredient.optional ?? false,
    })),
    calorieSummary: buildCalorieSummary(meal),
    mealPrepSummary: buildMealPrepSummary(meal),
    notes: meal.notes ?? meal.mealPrep?.prepNotes ?? null,
  };
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
    shoppingGroups: groupShoppingListItems(plannerResponse.shoppingList),
    plannerNotes: plannerResponse.plannerNotes ?? [],
    warnings: plannerResponse.warnings ?? [],
  };
}
