import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

import { createDatabase } from "../src/db/client";
import {
  FixtureDinnerReplacementAdapter,
  OpenClawCliDinnerReplacementAdapter,
  createDinnerReplacementAdapterFromEnv,
  type DinnerReplacementAdapter,
} from "../src/planner/dinner-replacement-adapter";
import { buildDinnerReplacementRequest } from "../src/planner/dinner-replacement";
import { replaceDinnerPairForWeek } from "../src/planner/dinner-replacement-flow";
import { createPlannerJobForWeek } from "../src/planner/job-flow";
import {
  completePlannerJob,
  getLatestSuccessfulPlannerJobForWeek,
  startPlannerJob,
} from "../src/planner/repository";
import { buildDemoPlannerResponse } from "../src/planner/response";
import type { SqliteDatabase } from "../src/db/sqlite";

let db: SqliteDatabase;

function createSuccessfulWeek(): void {
  const job = createPlannerJobForWeek(db, "2026-W30");
  startPlannerJob(db, job.jobId);
  completePlannerJob(db, job.jobId, buildDemoPlannerResponse());
}

describe("dinner replacement", () => {
  beforeEach(() => {
    db = createDatabase(":memory:");
    createSuccessfulWeek();
  });

  afterEach(() => {
    db.close();
  });

  it("replaces only the selected dinner pair and rebuilds the shopping list", async () => {
    const before = getLatestSuccessfulPlannerJobForWeek(db, "2026-W30")!;
    const beforeResponse = before.response as ReturnType<typeof buildDemoPlannerResponse>;
    const targetMealIds = new Set(
      beforeResponse.plan.days.flatMap((day) => day.meals)
        .filter((meal) => meal.dinnerLeftovers?.leftoverGroupId === "dinner-leftover-bolognese")
        .map((meal) => meal.mealId),
    );
    const beforeNonTargetMeals = beforeResponse.plan.days.flatMap((day) =>
      day.meals.filter((meal) => !targetMealIds.has(meal.mealId)),
    );

    await replaceDinnerPairForWeek(
      db,
      "2026-W30",
      "dinner-leftover-bolognese",
      new FixtureDinnerReplacementAdapter(),
    );

    const after = getLatestSuccessfulPlannerJobForWeek(db, "2026-W30")!;
    const afterResponse = after.response as ReturnType<typeof buildDemoPlannerResponse>;
    const afterNonTargetMeals = afterResponse.plan.days.flatMap((day) =>
      day.meals.filter((meal) => !targetMealIds.has(meal.mealId)),
    );
    const replacementMeals = afterResponse.plan.days.flatMap((day) =>
      day.meals.filter((meal) => meal.dinnerLeftovers?.leftoverGroupId === "dinner-replacement-dinner-leftover-bolognese"),
    );

    expect(afterNonTargetMeals).toEqual(beforeNonTargetMeals);
    expect(replacementMeals).toHaveLength(2);
    expect(replacementMeals.map((meal) => meal.dinnerLeftovers?.role).sort()).toEqual(["fresh_cook", "leftover"]);
    expect(afterResponse.shoppingList.some((item) => item.name === "Rinderhack")).toBe(false);
    expect(afterResponse.shoppingList.find((item) => item.name === "Kichererbsen")).toMatchObject({ amount: 4, unit: "can" });
    expect(afterResponse.shoppingList.find((item) => item.name === "Reis")).toMatchObject({ amount: 1460, unit: "g" });
  });

  it("keeps the existing week intact when the replacement response is invalid", async () => {
    const before = getLatestSuccessfulPlannerJobForWeek(db, "2026-W30")!;
    const failingAdapter: DinnerReplacementAdapter = {
      async replaceDinner(request) {
        const valid = await new FixtureDinnerReplacementAdapter().replaceDinner(request);
        valid.meals[0]!.dayId = "outside-target";
        return valid;
      },
    };

    await expect(
      replaceDinnerPairForWeek(db, "2026-W30", "dinner-leftover-bolognese", failingAdapter),
    ).rejects.toThrow("nur die beiden ausgewählten Abendessen");

    expect(getLatestSuccessfulPlannerJobForWeek(db, "2026-W30")?.response).toEqual(before.response);
  });

  it("rejects swapped leftover roles and duplicate target day metadata", async () => {
    const before = getLatestSuccessfulPlannerJobForWeek(db, "2026-W30")!;
    const invalidResponses = [
      async (request: Parameters<DinnerReplacementAdapter["replaceDinner"]>[0]) => {
        const valid = await new FixtureDinnerReplacementAdapter().replaceDinner(request);
        const [fresh, leftover] = valid.meals;
        fresh!.dinnerLeftovers!.role = "leftover";
        leftover!.dinnerLeftovers!.role = "fresh_cook";
        return valid;
      },
      async (request: Parameters<DinnerReplacementAdapter["replaceDinner"]>[0]) => {
        const valid = await new FixtureDinnerReplacementAdapter().replaceDinner(request);
        for (const meal of valid.meals) {
          meal.dinnerLeftovers!.plannedDayIds = [request.target.days[0]!.dayId, request.target.days[0]!.dayId];
          meal.dinnerLeftovers!.plannedWeekdays = [request.target.days[0]!.weekday, request.target.days[0]!.weekday];
        }
        return valid;
      },
    ];

    for (const replaceDinner of invalidResponses) {
      await expect(
        replaceDinnerPairForWeek(db, "2026-W30", "dinner-leftover-bolognese", { replaceDinner }),
      ).rejects.toThrow("Restetag-Informationen");
      expect(getLatestSuccessfulPlannerJobForWeek(db, "2026-W30")?.response).toEqual(before.response);
    }
  });

  it("asks OpenClaw for only the bounded dinner replacement contract", async () => {
    const job = getLatestSuccessfulPlannerJobForWeek(db, "2026-W30")!;
    const request = buildDinnerReplacementRequest(
      job.request as Parameters<typeof buildDinnerReplacementRequest>[0],
      job.response as ReturnType<typeof buildDemoPlannerResponse>,
      "dinner-leftover-bolognese",
    );
    const replacement = await new FixtureDinnerReplacementAdapter().replaceDinner(request);
    const calls: Array<{ args: string[]; prompt: string }> = [];
    const adapter = new OpenClawCliDinnerReplacementAdapter({
      command: "openclaw-test",
      commandRunner: async (_command, args) => {
        const messagePath = args[args.indexOf("--message-file") + 1]!;
        calls.push({ args, prompt: await readFile(messagePath, "utf8") });
        return { stdout: JSON.stringify({ payloads: [{ text: JSON.stringify(replacement) }] }), stderr: "" };
      },
    });

    await expect(adapter.replaceDinner(request)).resolves.toMatchObject({
      targetLeftoverGroupId: "dinner-leftover-bolognese",
      meals: [{ mealType: "dinner" }, { mealType: "dinner" }],
    });
    expect(calls[0]?.args).toEqual(expect.arrayContaining(["agent", "--message-file", "--json"]));
    expect(calls[0]?.prompt).toContain("Return exactly two meals and nothing else from the week plan.");
    expect(calls[0]?.prompt).toContain("dinner-leftover-bolognese");
  });

  it("rejects unsupported OpenClaw thinking levels before starting a replacement", () => {
    expect(() =>
      createDinnerReplacementAdapterFromEnv({
        ESSENPLANNER_PLANNER_ADAPTER: "openclaw-cli",
        OPENCLAW_THINKING: "max",
      }),
    ).toThrow("OPENCLAW_THINKING must be one of none, low, medium, or high.");
  });
});
