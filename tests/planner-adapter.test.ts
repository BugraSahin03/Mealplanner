import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/client";
import {
  FixturePlannerAdapter,
  OpenClawCliPlannerAdapter,
  createPlannerAdapterFromEnv,
  runPlannerJob,
  type PlannerAdapter,
} from "../src/planner/adapter";
import { parseOpenClawPlannerResponse, parsePlannerResponseJson } from "../src/planner/openclaw-output";
import { buildPlannerPrompt } from "../src/planner/prompt";
import type { PlannerRequest } from "../src/planner/request";
import { createPlannerJob, getPlannerJob, startPlannerJob } from "../src/planner/repository";
import { buildDemoPlannerResponse, type PlannerResponse } from "../src/planner/response";

const plannerRequest: PlannerRequest = {
  schemaVersion: "1.0",
  week: {
    weekStartDate: "2026-07-06",
    calendarYear: 2026,
    calendarWeek: 28,
    homeOfficeTargets: { bugra: 2, sena: 2 },
    days: [
      {
        dayId: "monday",
        date: "2026-07-06",
        weekday: "monday",
        personContexts: [
          { personId: "bugra", dayContext: "office" },
          { personId: "sena", dayContext: "home" },
        ],
      },
    ],
  },
  people: [
    {
      schemaVersion: "1.0",
      personId: "bugra",
      displayName: "Bugra",
      goals: {
        primaryGoal: "muscle_gain",
        proteinFocus: true,
        notes: "Proteinreich planen.",
      },
      preferences: {
        likedCuisines: [],
        dislikedIngredients: [],
        allergies: [],
        notes: "Proteinreich planen.",
      },
      mealGuidance: {
        breakfast: "Einfach",
        lunch: "Meal Prep",
        dinner: "Gemeinsam",
      },
      hardRules: [],
      softRules: [],
    },
    {
      schemaVersion: "1.0",
      personId: "sena",
      displayName: "Sena",
      goals: {
        primaryGoal: "balanced",
        proteinFocus: false,
        notes: "Ausgewogen planen.",
      },
      preferences: {
        likedCuisines: [],
        dislikedIngredients: [],
        allergies: [],
        notes: "Ausgewogen planen.",
      },
      mealGuidance: {
        breakfast: "Einfach",
        lunch: "Homeoffice",
        dinner: "Gemeinsam",
      },
      hardRules: [],
      softRules: [],
    },
  ],
  planningRules: {
    mealsPerDay: ["breakfast", "lunch", "dinner"],
    budget: {
      monthlyBudgetEur: 500,
      weeklyTargetEur: 115,
      notes: "Budget beachten.",
    },
    lunchBatchPrep: {
      enabled: true,
      weekdayDishCount: 2,
      weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      notes: "Zwei Lunch-Batches fuer die Arbeitswoche.",
    },
    shoppingMode: "weekly",
    stores: ["Netto", "Lidl"],
    globalNotes: "Abendessen gemeinsam planen.",
  },
};

describe("planner adapter", () => {
  it("builds a German-facing prompt with request and response schema", () => {
    const prompt = buildPlannerPrompt(plannerRequest);

    expect(prompt).toContain("Your response MUST validate against the following JSON Schema");
    expect(prompt).toContain("\"$id\": \"https://essenplanner.local/schemas/planner-response.schema.json\"");
    expect(prompt).toContain("\"weekStartDate\": \"2026-07-06\"");
    expect(prompt).toContain("\"weekdayDishCount\": 2");
    expect(prompt).toContain("no more than planningRules.lunchBatchPrep.weekdayDishCount distinct lunch dishes");
    expect(prompt).toContain("gramsPerPortion");
    expect(prompt).toContain("Write all user-facing titles");
    expect(prompt).toContain("in German");
  });

  it("parses OpenClaw payload text even when JSON is wrapped in surrounding text", () => {
    const response = buildDemoPlannerResponse();
    const output = JSON.stringify({
      payloads: [
        {
          text: `Hier ist der Plan:\n\n\`\`\`json\n${JSON.stringify(response)}\n\`\`\``,
        },
      ],
    });

    expect(parseOpenClawPlannerResponse(output)).toMatchObject({
      schemaVersion: "1.0",
      plan: { title: "Demo-Wochenplan" },
    });
  });

  it("rejects OpenClaw output without payload text", () => {
    expect(() => {
      parseOpenClawPlannerResponse(JSON.stringify({ payloads: [{}] }));
    }).toThrow("payloads[0].text");
  });

  it("rejects planner response JSON that does not match the official schema", () => {
    const invalid = {
      ...buildDemoPlannerResponse(),
      plan: {
        ...buildDemoPlannerResponse().plan,
        days: [],
      },
    };

    expect(() => {
      parsePlannerResponseJson(JSON.stringify(invalid));
    }).toThrow("Invalid planner response");
  });

  it("uses a fixture adapter by default and OpenClaw CLI when configured", () => {
    expect(createPlannerAdapterFromEnv({})).toBeInstanceOf(FixturePlannerAdapter);
    expect(
      createPlannerAdapterFromEnv({
        ESSENPLANNER_PLANNER_ADAPTER: "openclaw-cli",
      }),
    ).toBeInstanceOf(OpenClawCliPlannerAdapter);
  });

  it("calls OpenClaw CLI with a generated prompt file and validates stdout", async () => {
    const response = buildDemoPlannerResponse();
    const calls: Array<{ command: string; args: string[]; prompt: string }> = [];
    const adapter = new OpenClawCliPlannerAdapter({
      command: "openclaw-test",
      agent: "main",
      sessionKey: "test-session",
      timeoutSeconds: 60,
      commandRunner: async (command, args) => {
        const messageFileIndex = args.indexOf("--message-file");
        const messageFile = args[messageFileIndex + 1];
        calls.push({
          command,
          args,
          prompt: await readFile(messageFile, "utf8"),
        });
        return {
          stdout: JSON.stringify({ payloads: [{ text: JSON.stringify(response) }] }),
          stderr: "",
        };
      },
    });

    await expect(adapter.createPlan(plannerRequest)).resolves.toMatchObject({
      schemaVersion: "1.0",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.command).toBe("openclaw-test");
    expect(calls[0]?.args).toEqual(
      expect.arrayContaining([
        "agent",
        "--local",
        "--agent",
        "main",
        "--session-key",
        "test-session",
        "--json",
        "--timeout",
        "60",
      ]),
    );
    expect(calls[0]?.prompt).toContain("\"weekStartDate\": \"2026-07-06\"");
  });

  it("does not store invalid adapter responses on a planner job", async () => {
    const db = createDatabase(":memory:");
    const invalidAdapter: PlannerAdapter = {
      async createPlan() {
        return {
          ...buildDemoPlannerResponse(),
          extra: true,
        } as PlannerResponse;
      },
    };

    try {
      createPlannerJob(db, {
        jobId: "job-openclaw-invalid",
        request: plannerRequest,
      });

      const result = await runPlannerJob(db, "job-openclaw-invalid", invalidAdapter);
      const saved = getPlannerJob(db, "job-openclaw-invalid");

      expect(result.status).toBe("failed");
      expect(result.errorCode).toBe("planner_adapter_failed");
      expect(saved?.response).toBeNull();
      expect(saved?.errorMessage).toContain("Invalid planner response");
    } finally {
      db.close();
    }
  });

  it("can continue a job that was already marked as running", async () => {
    const db = createDatabase(":memory:");

    try {
      createPlannerJob(db, {
        jobId: "job-openclaw-running",
        request: plannerRequest,
      });
      startPlannerJob(db, "job-openclaw-running");

      await runPlannerJob(db, "job-openclaw-running", new FixturePlannerAdapter());

      expect(getPlannerJob(db, "job-openclaw-running")?.status).toBe("success");
    } finally {
      db.close();
    }
  });
});
