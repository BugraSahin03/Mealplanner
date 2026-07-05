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
  dinnerLeftoverGroupId: string | null;
  dinnerLeftoverLabel: string | null;
  dinnerLeftoverRole: "fresh_cook" | "leftover" | "repeat_serving" | null;
  ingredientSummary: string;
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

export type DinnerLeftoverGroupView = {
  leftoverGroupId: string;
  title: string;
  daysSummary: string;
  spanDays: number;
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
  dinnerLeftoverGroups: DinnerLeftoverGroupView[];
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

const dinnerLeftoverRoleLabels: Record<"fresh_cook" | "leftover" | "repeat_serving", string> = {
  fresh_cook: "Frisch gekocht",
  leftover: "Restetag",
  repeat_serving: "Wiederholung",
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

function mapMeal(meal: PlannerResponse["plan"]["days"][number]["meals"][number]): MealView {
  const people = meal.people.map<MealPersonView>((person) => ({
    personId: person.personId,
    label: personLabels[person.personId],
    portion: person.portion ? portionLabels[person.portion] : null,
    gramsPerPortion: person.gramsPerPortion ?? null,
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
    isPersonalMeal: people.length === 1 && meal.mealType !== "dinner",
    isSharedDinner: meal.mealType === "dinner" && meal.context === "shared" && people.length > 1,
    dinnerLeftoverGroupId: meal.dinnerLeftovers?.leftoverGroupId ?? null,
    dinnerLeftoverLabel: meal.dinnerLeftovers
      ? dinnerLeftoverRoleLabels[meal.dinnerLeftovers.role]
      : null,
    dinnerLeftoverRole: meal.dinnerLeftovers?.role ?? null,
    ingredientSummary: buildIngredientSummary(meal),
    portionSummary: buildPortionSummary(people),
    notes: meal.notes ?? meal.mealPrep?.prepNotes ?? meal.dinnerLeftovers?.notes ?? null,
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

function buildDinnerLeftoverGroups(plannerResponse: PlannerResponse): DinnerLeftoverGroupView[] {
  const groups = new Map<string, DinnerLeftoverGroupView>();

  for (const day of plannerResponse.plan.days) {
    for (const meal of day.meals) {
      if (
        meal.mealType !== "dinner" ||
        !meal.dinnerLeftovers ||
        groups.has(meal.dinnerLeftovers.leftoverGroupId)
      ) {
        continue;
      }

      groups.set(meal.dinnerLeftovers.leftoverGroupId, {
        leftoverGroupId: meal.dinnerLeftovers.leftoverGroupId,
        title: meal.title,
        daysSummary: meal.dinnerLeftovers.plannedWeekdays
          .map((weekday) => weekdayShortLabels[weekday])
          .join(", "),
        spanDays: meal.dinnerLeftovers.spanDays,
        notes: meal.dinnerLeftovers.notes ?? null,
      });
    }
  }

  return [...groups.values()];
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
    dinnerLeftoverGroups: buildDinnerLeftoverGroups(plannerResponse),
    shoppingGroups: groupShoppingListItems(plannerResponse.shoppingList),
    plannerNotes: plannerResponse.plannerNotes ?? [],
    warnings: plannerResponse.warnings ?? [],
  };
}
