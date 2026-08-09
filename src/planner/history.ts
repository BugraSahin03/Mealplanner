import type { PlannerJob } from "./repository";
import { assertPlannerResponse, type PlannerResponseMeal } from "./response";

export type PlannerHistoryMeal = {
  title: string;
  normalizedTitle: string;
  people: Array<"bugra" | "sena">;
  coreIngredients: string[];
  proteinSource?: string;
};

export type PlannerHistoryWeek = {
  weekId: string;
  calendarYear: number;
  calendarWeek: number;
  meals: {
    breakfast: PlannerHistoryMeal[];
    lunch: PlannerHistoryMeal[];
    dinner: PlannerHistoryMeal[];
  };
};

export type PlannerHistory = {
  latestWeeks: PlannerHistoryWeek[];
};

const proteinKeywords = [
  "huhn",
  "haehnchen",
  "chicken",
  "pute",
  "puten",
  "rind",
  "hack",
  "lachs",
  "thunfisch",
  "fisch",
  "tofu",
  "tempeh",
  "linsen",
  "bohnen",
  "kichererbsen",
  "ei",
  "eier",
  "skyr",
  "quark",
  "feta",
];

export function normalizeMealTitle(value: string): string {
  return value
    .toLocaleLowerCase("de-DE")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function findProteinSource(ingredients: string[]): string | undefined {
  return ingredients.find((ingredient) => {
    const normalized = normalizeMealTitle(ingredient);
    return proteinKeywords.some((keyword) => normalized.includes(keyword));
  });
}

function toHistoryMeal(meal: PlannerResponseMeal): PlannerHistoryMeal {
  const coreIngredients = meal.ingredients
    .map((ingredient) => ingredient.name)
    .filter((name, index, names) => names.indexOf(name) === index)
    .slice(0, 4);

  const proteinSource = findProteinSource(coreIngredients);

  return {
    title: meal.title,
    normalizedTitle: normalizeMealTitle(meal.title),
    people: meal.people.map((person) => person.personId),
    coreIngredients,
    ...(proteinSource ? { proteinSource } : {}),
  };
}

function mealHistoryKey(meal: PlannerResponseMeal): string {
  if (meal.mealType === "dinner" && meal.dinnerLeftovers) {
    return `dinner:${meal.dinnerLeftovers.leftoverGroupId}`;
  }

  const people = meal.people
    .map((person) => person.personId)
    .sort()
    .join(",");
  return `${meal.mealType}:${people}:${normalizeMealTitle(meal.title)}`;
}

function parseWeekId(weekId: string): { calendarYear: number; calendarWeek: number } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) {
    return null;
  }

  return { calendarYear: Number(match[1]), calendarWeek: Number(match[2]) };
}

function toHistoryWeek(job: PlannerJob): PlannerHistoryWeek | null {
  if (!job.weekId || !job.response) {
    return null;
  }

  const week = parseWeekId(job.weekId);
  if (!week) {
    return null;
  }

  const response = assertPlannerResponse(job.response);
  const meals: PlannerHistoryWeek["meals"] = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };
  const seen = new Set<string>();

  for (const day of response.plan.days) {
    for (const meal of day.meals) {
      if (meal.mealType !== "breakfast" && meal.mealType !== "lunch" && meal.mealType !== "dinner") {
        continue;
      }

      const key = mealHistoryKey(meal);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      meals[meal.mealType].push(toHistoryMeal(meal));
    }
  }

  return { weekId: job.weekId, ...week, meals };
}

export function buildPlannerHistory(jobs: PlannerJob[], maxWeeks = 4): PlannerHistory {
  const latestWeeks: PlannerHistoryWeek[] = [];
  const seenWeekIds = new Set<string>();

  for (const job of jobs) {
    if (job.status !== "success" || !job.weekId || seenWeekIds.has(job.weekId)) {
      continue;
    }

    const week = toHistoryWeek(job);
    if (!week) {
      continue;
    }

    seenWeekIds.add(job.weekId);
    latestWeeks.push(week);
    if (latestWeeks.length === maxWeeks) {
      break;
    }
  }

  return { latestWeeks };
}
