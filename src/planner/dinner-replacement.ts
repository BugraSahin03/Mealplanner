import { findProteinSource, normalizeMealTitle, type PlannerHistory } from "./history";
import type { PlannerRequest, PlannerRequestPerson } from "./request";
import {
  assertPlannerResponse,
  type PlannerResponse,
  type PlannerResponseMeal,
  type PlannerResponseShoppingCategory,
  type PlannerResponseUnit,
} from "./response";
import { validateDinnerReplacementResponseAgainstSchema } from "./schema-validation";

export type DinnerReplacementResponse = {
  schemaVersion: "1.0";
  targetLeftoverGroupId: string;
  meals: Array<PlannerResponseMeal & { dayId: string }>;
  notes?: string[];
  warnings?: string[];
};

export type DinnerReplacementRequest = {
  schemaVersion: "1.0";
  week: PlannerRequest["week"];
  people: PlannerRequestPerson[];
  target: {
    leftoverGroupId: string;
    days: Array<{
      dayId: string;
      weekday: PlannerResponse["plan"]["days"][number]["weekday"];
      date?: string;
      mealId: string;
      title: string;
      role: "fresh_cook" | "leftover" | "repeat_serving";
    }>;
  };
  otherDinners: Array<{
    dayId: string;
    weekday: PlannerResponse["plan"]["days"][number]["weekday"];
    title: string;
    coreIngredients: string[];
  }>;
  excludedDinners: Array<{
    title: string;
    normalizedTitle: string;
    coreIngredients: string[];
    proteinSource?: string;
  }>;
  planningHistory?: PlannerHistory;
  planningRules: PlannerRequest["planningRules"]["dinnerLeftoverPlanning"];
};

type TargetDinner = {
  day: PlannerResponse["plan"]["days"][number];
  meal: PlannerResponseMeal;
};

function readTargetDinners(response: PlannerResponse, leftoverGroupId: string): TargetDinner[] {
  return response.plan.days.flatMap((day) =>
    day.meals.flatMap((meal) =>
      meal.mealType === "dinner" && meal.dinnerLeftovers?.leftoverGroupId === leftoverGroupId
        ? [{ day, meal }]
        : [],
    ),
  );
}

function compactDinner(meal: PlannerResponseMeal): DinnerReplacementRequest["excludedDinners"][number] {
  const coreIngredients = meal.ingredients.map((ingredient) => ingredient.name).slice(0, 4);
  const proteinSource = findProteinSource(coreIngredients);

  return {
    title: meal.title,
    normalizedTitle: normalizeMealTitle(meal.title),
    coreIngredients,
    ...(proteinSource ? { proteinSource } : {}),
  };
}

export function buildDinnerReplacementRequest(
  plannerRequest: PlannerRequest,
  response: PlannerResponse,
  leftoverGroupId: string,
): DinnerReplacementRequest {
  const targetDinners = readTargetDinners(response, leftoverGroupId);
  if (targetDinners.length !== 2) {
    throw new Error("Dieses Abendessen kann nur als vollständiges Zwei-Tage-Paar ausgetauscht werden.");
  }

  const targetMealIds = new Set(targetDinners.map(({ meal }) => meal.mealId));
  const excludedDinners = targetDinners.map(({ meal }) => compactDinner(meal));

  return {
    schemaVersion: "1.0",
    week: plannerRequest.week,
    people: plannerRequest.people,
    target: {
      leftoverGroupId,
      days: targetDinners.map(({ day, meal }) => ({
        dayId: day.dayId,
        weekday: day.weekday,
        ...(day.date ? { date: day.date } : {}),
        mealId: meal.mealId,
        title: meal.title,
        role: meal.dinnerLeftovers!.role,
      })),
    },
    otherDinners: response.plan.days.flatMap((day) =>
      day.meals.flatMap((meal) =>
        meal.mealType === "dinner" && !targetMealIds.has(meal.mealId)
          ? [{
              dayId: day.dayId,
              weekday: day.weekday,
              title: meal.title,
              coreIngredients: meal.ingredients.map((ingredient) => ingredient.name).slice(0, 4),
            }]
          : [],
      ),
    ),
    excludedDinners,
    ...(plannerRequest.planningHistory ? { planningHistory: plannerRequest.planningHistory } : {}),
    planningRules: plannerRequest.planningRules.dinnerLeftoverPlanning,
  };
}

function assertReplacementShape(value: unknown): asserts value is DinnerReplacementResponse {
  const errors = validateDinnerReplacementResponseAgainstSchema(value);
  if (errors.length > 0) {
    throw new Error(`Ungültige Dinner-Austausch-Antwort: ${errors.join(" ")}`);
  }

  const candidate = value as DinnerReplacementResponse;
  assertPlannerResponse({
    schemaVersion: "1.0",
    plan: {
      days: candidate.meals.map((replacementMeal) => {
        const meal = { ...replacementMeal };
        Reflect.deleteProperty(meal, "dayId");
        return {
          dayId: replacementMeal.dayId,
          weekday: replacementMeal.dinnerLeftovers?.plannedWeekdays[0] ?? "monday",
          meals: [meal as PlannerResponseMeal],
        };
      }),
    },
    shoppingList: [],
  });
}

function tokenSet(value: string): Set<string> {
  const ignored = new Set(["mit", "und", "aus", "der", "die", "das", "von", "fur"]);
  return new Set(
    normalizeMealTitle(value)
      .split(" ")
      .filter((token) => token.length > 2 && !ignored.has(token)),
  );
}

function hasSharedToken(left: string, right: string): boolean {
  const leftTokens = tokenSet(left);
  return [...tokenSet(right)].some((token) => leftTokens.has(token));
}

function assertNotRejectedVariant(
  replacement: PlannerResponseMeal,
  rejected: DinnerReplacementRequest["excludedDinners"][number],
): void {
  const replacementTitle = normalizeMealTitle(replacement.title);
  if (replacementTitle === rejected.normalizedTitle) {
    throw new Error("Das Ersatzgericht entspricht dem abgelehnten Gericht.");
  }

  const replacementIngredients = replacement.ingredients.map((ingredient) => ingredient.name);
  const replacementProtein = findProteinSource(replacementIngredients);
  const sameProtein = replacementProtein
    && rejected.proteinSource
    && normalizeMealTitle(replacementProtein) === normalizeMealTitle(rejected.proteinSource);
  const sharedIngredient = replacementIngredients.some((ingredient) =>
    rejected.coreIngredients.some((rejectedIngredient) =>
      normalizeMealTitle(ingredient) === normalizeMealTitle(rejectedIngredient),
    ),
  );

  if ((sameProtein && sharedIngredient) || hasSharedToken(replacement.title, rejected.title)) {
    throw new Error("Das Ersatzgericht ist dem abgelehnten Gericht zu ähnlich.");
  }
}

export function assertDinnerReplacement(
  replacement: unknown,
  request: DinnerReplacementRequest,
): asserts replacement is DinnerReplacementResponse {
  assertReplacementShape(replacement);

  if (replacement.targetLeftoverGroupId !== request.target.leftoverGroupId) {
    throw new Error("Die Austausch-Antwort gehört nicht zum ausgewählten Dinner-Paar.");
  }

  const targetByMealId = new Map(request.target.days.map((day) => [day.mealId, day]));
  const targetMealIds = new Set(targetByMealId.keys());
  const targetDayIds = new Set(request.target.days.map((day) => day.dayId));
  const targetWeekdays = new Set(request.target.days.map((day) => day.weekday));
  const responseMealIds = new Set(replacement.meals.map((meal) => meal.mealId));
  if (responseMealIds.size !== 2 || [...targetMealIds].some((mealId) => !responseMealIds.has(mealId))) {
    throw new Error("Die Austausch-Antwort darf nur die beiden ausgewählten Abendessen enthalten.");
  }

  const groupIds = new Set<string>();
  const roles = new Set<string>();
  for (const meal of replacement.meals) {
    const target = targetByMealId.get(meal.mealId);
    if (!target || meal.mealType !== "dinner" || meal.context !== "shared") {
      throw new Error("Die Austausch-Antwort enthält kein gültiges gemeinsames Abendessen.");
    }
    const hasCompletePeople = meal.people.length === 2
      && new Set(meal.people.map((person) => person.personId)).size === 2
      && meal.people.every(
        (person) => (person.gramsPerPortion ?? person.portionGrams) !== undefined
          && person.estimatedKcal !== undefined,
      );
    if (meal.dayId !== target.dayId) {
      throw new Error("Die Austausch-Antwort darf nur die beiden ausgewählten Abendessen enthalten.");
    }
    if (!hasCompletePeople || meal.ingredients.length === 0) {
      throw new Error("Das Ersatzgericht enthält unvollständige Tages-, Portions- oder Zutatenangaben.");
    }

    const leftovers = meal.dinnerLeftovers;
    if (
      !leftovers
      || leftovers.role !== target.role
      || leftovers.plannedDayIds.length !== 2
      || leftovers.plannedWeekdays.length !== 2
      || new Set(leftovers.plannedDayIds).size !== targetDayIds.size
      || new Set(leftovers.plannedWeekdays).size !== targetWeekdays.size
      || leftovers.plannedDayIds.some((dayId) => !targetDayIds.has(dayId))
      || leftovers.plannedWeekdays.some((weekday) => !targetWeekdays.has(weekday))
    ) {
      throw new Error("Die Restetag-Informationen des Ersatzgerichts sind unvollständig.");
    }
    groupIds.add(leftovers.leftoverGroupId);
    roles.add(leftovers.role);
    request.excludedDinners.forEach((rejected) => assertNotRejectedVariant(meal, rejected));
  }

  if (groupIds.size !== 1 || groupIds.has(request.target.leftoverGroupId)) {
    throw new Error("Das Ersatzpaar benötigt eine gemeinsame neue Restetag-Gruppe.");
  }
  if (!roles.has("fresh_cook") || !roles.has("leftover")) {
    throw new Error("Das Ersatzpaar benötigt genau einen Frischkochtag und einen Restetag.");
  }
}

function canonicalUnit(unit: PlannerResponseUnit): { unit: PlannerResponseUnit; factor: number } {
  if (unit === "kg") return { unit: "g", factor: 1000 };
  if (unit === "l") return { unit: "ml", factor: 1000 };
  return { unit, factor: 1 };
}

export function rebuildShoppingList(response: PlannerResponse): PlannerResponse["shoppingList"] {
  const merged = new Map<string, PlannerResponse["shoppingList"][number]>();

  for (const day of response.plan.days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const normalizedName = normalizeMealTitle(ingredient.name);
        const normalizedUnit = canonicalUnit(ingredient.unit);
        const category = ingredient.category ?? "other";
        const key = `${normalizedName}:${normalizedUnit.unit}:${category}:${ingredient.pantryItem ? "pantry" : "fresh"}:${ingredient.optional ? "optional" : "required"}`;
        const existing = merged.get(key);
        const amount = ingredient.amount * normalizedUnit.factor;
        if (existing) {
          existing.amount += amount;
          existing.sourceMealIds = [...new Set([...(existing.sourceMealIds ?? []), meal.mealId])];
        } else {
          merged.set(key, {
            name: ingredient.name,
            amount,
            unit: normalizedUnit.unit,
            category: category as PlannerResponseShoppingCategory,
            sourceMealIds: [meal.mealId],
            pantryItem: ingredient.pantryItem,
            optional: ingredient.optional,
            notes: ingredient.notes,
          });
        }
      }
    }
  }

  return [...merged.values()];
}

export function mergeDinnerReplacement(
  current: PlannerResponse,
  replacement: DinnerReplacementResponse,
): PlannerResponse {
  const replacementByMealId = new Map<string, PlannerResponseMeal>(
    replacement.meals.map((replacementMeal) => {
      const meal = { ...replacementMeal };
      Reflect.deleteProperty(meal, "dayId");
      return [meal.mealId, meal as PlannerResponseMeal];
    }),
  );
  const merged: PlannerResponse = {
    ...current,
    plan: {
      ...current.plan,
      days: current.plan.days.map((day) => ({
        ...day,
        meals: day.meals.map((meal) => replacementByMealId.get(meal.mealId) ?? meal),
      })),
    },
  };

  return {
    ...merged,
    shoppingList: rebuildShoppingList(merged),
    ...(replacement.notes?.length ? { plannerNotes: [...(merged.plannerNotes ?? []), ...replacement.notes] } : {}),
    ...(replacement.warnings?.length ? { warnings: [...(merged.warnings ?? []), ...replacement.warnings] } : {}),
  };
}
