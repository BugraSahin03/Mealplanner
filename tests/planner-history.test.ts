import { describe, expect, it } from "vitest";

import { buildPlannerHistory, normalizeMealTitle } from "../src/planner/history";
import type { PlannerJob } from "../src/planner/repository";
import { buildDemoPlannerResponse } from "../src/planner/response";

function successfulJob(weekId: string, jobId: string): PlannerJob {
  return {
    jobId,
    weekId,
    status: "success",
    request: {},
    response: buildDemoPlannerResponse(),
    errorMessage: null,
    errorCode: null,
    createdAt: null,
    updatedAt: null,
    completedAt: null,
  };
}

describe("planner history", () => {
  it("normalizes common German title variations for prompt comparison", () => {
    expect(normalizeMealTitle("Ofenlachs mit Kartoffeln & Brokkoli!")).toBe(
      "ofenlachs mit kartoffeln brokkoli",
    );
  });

  it("keeps only the newest successful run for each week and limits the lookback", () => {
    const history = buildPlannerHistory([
      successfulJob("2026-W29", "newest-w29"),
      successfulJob("2026-W29", "older-w29"),
      successfulJob("2026-W28", "w28"),
      successfulJob("2026-W27", "w27"),
      successfulJob("2026-W26", "w26"),
      successfulJob("2026-W25", "w25"),
    ]);

    expect(history.latestWeeks.map((week) => week.weekId)).toEqual([
      "2026-W29",
      "2026-W28",
      "2026-W27",
      "2026-W26",
    ]);
  });

  it("counts a fresh dinner and its leftover day as one historical dish", () => {
    const history = buildPlannerHistory([successfulJob("2026-W29", "w29")]);
    const dinners = history.latestWeeks[0]?.meals.dinner ?? [];

    expect(dinners.filter((meal) => meal.title === "Bolognese mit Pasta")).toHaveLength(1);
    expect(dinners.find((meal) => meal.title === "Bolognese mit Pasta")).toMatchObject({
      coreIngredients: ["Pasta", "Rinderhack", "Tomaten"],
      proteinSource: "Rinderhack",
      people: ["bugra", "sena"],
    });
  });

});
