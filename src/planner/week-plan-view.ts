import { groupShoppingListItems, type ShoppingListGroupView } from "../shopping-list/grouping";
import { assertPlannerResponse, type PlannerResponse } from "./response";
import type { MealContext, MealType, Weekday } from "./repository";

export type MealPersonView = {
  personId: "bugra" | "sena";
  label: string;
  portion: string | null;
};

export type MealView = {
  mealId: string;
  mealType: MealType;
  slotLabel: string;
  title: string;
  contextLabel: string;
  people: MealPersonView[];
  peopleSummary: string;
  isSharedDinner: boolean;
  ingredientSummary: string;
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
  breakfast: "Fruehstueck",
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
  large: "gross",
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

function mapMeal(meal: PlannerResponse["plan"]["days"][number]["meals"][number]): MealView {
  const people = meal.people.map<MealPersonView>((person) => ({
    personId: person.personId,
    label: personLabels[person.personId],
    portion: person.portion ? portionLabels[person.portion] : null,
  }));

  return {
    mealId: meal.mealId,
    mealType: meal.mealType,
    slotLabel: mealTypeLabels[meal.mealType],
    title: meal.title,
    contextLabel: contextLabels[meal.context],
    people,
    peopleSummary: buildPeopleSummary(people, meal.context),
    isSharedDinner: meal.mealType === "dinner" && meal.context === "shared" && people.length > 1,
    ingredientSummary: buildIngredientSummary(meal),
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
