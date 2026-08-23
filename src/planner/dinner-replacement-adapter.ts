import { execFile as execFileWithCallback } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { extractOpenClawPlannerText, parseFirstJsonObject } from "./openclaw-output";
import { assertDinnerReplacement, type DinnerReplacementRequest, type DinnerReplacementResponse } from "./dinner-replacement";
import type { OpenClawCommandRunner } from "./adapter";
import { buildDinnerReplacementPrompt } from "./dinner-replacement-prompt";

const execFile = promisify(execFileWithCallback);

type AdapterOptions = {
  command?: string;
  agent?: string;
  sessionKey?: string;
  timeoutSeconds?: number;
  thinking?: "none" | "low" | "medium" | "high";
  local?: boolean;
  commandRunner?: OpenClawCommandRunner;
};

function readTimeout(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 60 || timeout > 1200) {
    throw new Error("OPENCLAW_TIMEOUT_SECONDS must be an integer between 60 and 1200.");
  }
  return timeout;
}

function readThinking(value: string | undefined): AdapterOptions["thinking"] | undefined {
  if (!value?.trim()) return undefined;
  if (!(["none", "low", "medium", "high"] as const).includes(value as "none" | "low" | "medium" | "high")) {
    throw new Error("OPENCLAW_THINKING must be one of none, low, medium, or high.");
  }
  return value as AdapterOptions["thinking"];
}

async function commandRunner(command: string, args: string[], timeoutMs: number): Promise<string> {
  const result = await execFile(command, args, { maxBuffer: 10 * 1024 * 1024, timeout: timeoutMs });
  return result.stdout;
}

const normalizedUnits: Record<string, string> = {
  gramm: "g",
  gram: "g",
  kilogramm: "kg",
  milliliter: "ml",
  liter: "l",
  stueck: "piece",
  "stück": "piece",
  pcs: "piece",
  el: "tbsp",
  essloeffel: "tbsp",
  "esslöffel": "tbsp",
  tl: "tsp",
  teeloeffel: "tsp",
  "teelöffel": "tsp",
  packung: "pack",
  dose: "can",
  glas: "jar",
  flasche: "bottle",
};

function normalizeIngredientUnits(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const response = structuredClone(value) as { meals?: Array<{ ingredients?: Array<{ unit?: unknown }> }> };
  for (const meal of response.meals ?? []) {
    for (const ingredient of meal.ingredients ?? []) {
      if (typeof ingredient.unit !== "string") continue;
      const normalized = normalizedUnits[ingredient.unit.trim().toLocaleLowerCase("de-DE")];
      if (normalized) ingredient.unit = normalized;
    }
  }
  return response;
}

function parseReplacementOutput(rawOutput: string, request: DinnerReplacementRequest): DinnerReplacementResponse {
  const outer = parseFirstJsonObject(rawOutput);
  const parsed = normalizeIngredientUnits(
    outer && typeof outer === "object" && Array.isArray((outer as { payloads?: unknown }).payloads)
      ? parseFirstJsonObject(extractOpenClawPlannerText(outer))
      : outer,
  ) as DinnerReplacementResponse;
  assertDinnerReplacement(parsed, request);
  return parsed;
}

export type DinnerReplacementAdapter = {
  replaceDinner(request: DinnerReplacementRequest): Promise<DinnerReplacementResponse>;
};

export class FixtureDinnerReplacementAdapter implements DinnerReplacementAdapter {
  async replaceDinner(request: DinnerReplacementRequest): Promise<DinnerReplacementResponse> {
    const newGroupId = `dinner-replacement-${request.target.leftoverGroupId}`;
    const targetDays = request.target.days;
    const fresh = targetDays.find((day) => day.role === "fresh_cook") ?? targetDays[0]!;
    const leftover = targetDays.find((day) => day.role === "leftover") ?? targetDays[1]!;
    const plannedDayIds = targetDays.map((day) => day.dayId);
    const plannedWeekdays = targetDays.map((day) => day.weekday);
    const baseMeal = {
      mealType: "dinner" as const,
      title: "Kichererbsen-Spinat-Curry mit Reis",
      people: [
        { personId: "bugra" as const, portion: "large" as const, gramsPerPortion: 500, estimatedKcal: 720, estimatedKcalPer100g: 144 },
        { personId: "sena" as const, portion: "normal" as const, gramsPerPortion: 360, estimatedKcal: 520, estimatedKcalPer100g: 144 },
      ],
      context: "shared" as const,
      ingredients: [
        { name: "Kichererbsen", amount: 2, unit: "can" as const, category: "canned" as const },
        { name: "Spinat", amount: 400, unit: "g" as const, category: "frozen" as const },
        { name: "Kokosmilch", amount: 400, unit: "ml" as const, category: "canned" as const },
        { name: "Reis", amount: 320, unit: "g" as const, category: "dry_goods" as const },
      ],
    };

    const response: DinnerReplacementResponse = {
      schemaVersion: "1.0",
      targetLeftoverGroupId: request.target.leftoverGroupId,
      meals: [
        {
          ...baseMeal,
          mealId: fresh.mealId,
          dayId: fresh.dayId,
          dinnerLeftovers: {
            leftoverGroupId: newGroupId,
            role: "fresh_cook",
            plannedDayIds,
            plannedWeekdays,
            spanDays: 2,
            servingNumber: 1,
            totalServings: 2,
            notes: "Frisch kochen und die zweite Portion für den Folgetag aufbewahren.",
          },
        },
        {
          ...baseMeal,
          mealId: leftover.mealId,
          dayId: leftover.dayId,
          dinnerLeftovers: {
            leftoverGroupId: newGroupId,
            role: "leftover",
            plannedDayIds,
            plannedWeekdays,
            spanDays: 2,
            servingNumber: 2,
            totalServings: 2,
            notes: "Restetag des Curry-Paars.",
          },
        },
      ],
      notes: ["Dinner-Paar wurde gezielt ausgetauscht."],
    };
    assertDinnerReplacement(response, request);
    return response;
  }
}

export class OpenClawCliDinnerReplacementAdapter implements DinnerReplacementAdapter {
  private readonly options: Required<Omit<AdapterOptions, "commandRunner">>;
  private readonly runner: OpenClawCommandRunner | null;

  constructor(options: AdapterOptions = {}) {
    this.options = {
      command: options.command ?? "openclaw",
      agent: options.agent ?? "main",
      sessionKey: options.sessionKey ?? `essenplanner:dinner-replacement:${new Date().toISOString()}`,
      timeoutSeconds: options.timeoutSeconds ?? 420,
      thinking: options.thinking ?? "low",
      local: options.local ?? true,
    };
    this.runner = options.commandRunner ?? null;
  }

  async replaceDinner(request: DinnerReplacementRequest): Promise<DinnerReplacementResponse> {
    const tempDir = await mkdtemp(path.join(tmpdir(), "essenplanner-dinner-replacement-"));
    const messagePath = path.join(tempDir, "dinner-replacement-prompt.md");
    try {
      await writeFile(messagePath, buildDinnerReplacementPrompt(request), "utf8");
      const args = [
        "agent",
        ...(this.options.local ? ["--local"] : []),
        "--agent", this.options.agent,
        "--session-key", this.options.sessionKey,
        "--message-file", messagePath,
        "--json",
        "--timeout", String(this.options.timeoutSeconds),
        "--thinking", this.options.thinking,
      ];
      const stdout = this.runner
        ? (await this.runner(this.options.command, args, { timeoutMs: (this.options.timeoutSeconds + 5) * 1000 })).stdout
        : await commandRunner(this.options.command, args, (this.options.timeoutSeconds + 5) * 1000);
      return parseReplacementOutput(stdout, request);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

export function createDinnerReplacementAdapterFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): DinnerReplacementAdapter {
  const adapter = env.ESSENPLANNER_PLANNER_ADAPTER ?? "fixture";
  if (adapter === "openclaw-cli") {
    return new OpenClawCliDinnerReplacementAdapter({
      command: env.OPENCLAW_BIN,
      agent: env.OPENCLAW_AGENT,
      sessionKey: env.OPENCLAW_SESSION_KEY,
      timeoutSeconds: readTimeout(env.OPENCLAW_TIMEOUT_SECONDS),
      thinking: readThinking(env.OPENCLAW_THINKING),
      local: env.OPENCLAW_LOCAL === undefined ? true : env.OPENCLAW_LOCAL !== "false",
    });
  }
  if (adapter === "fixture") {
    return new FixtureDinnerReplacementAdapter();
  }
  throw new Error("ESSENPLANNER_PLANNER_ADAPTER must be fixture or openclaw-cli.");
}
