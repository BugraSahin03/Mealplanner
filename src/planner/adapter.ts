import { execFile as execFileWithCallback } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { SqliteDatabase } from "../db/sqlite";
import { buildPlannerPrompt } from "./prompt";
import type { PlannerRequest } from "./request";
import {
  completePlannerJob,
  failPlannerJob,
  getPlannerJob,
  startPlannerJob,
  type PlannerJob,
} from "./repository";
import { assertPlannerResponse, buildDemoPlannerResponse, type PlannerResponse } from "./response";
import { parseOpenClawPlannerResponse } from "./openclaw-output";

const execFile = promisify(execFileWithCallback);

export type PlannerAdapter = {
  createPlan(request: PlannerRequest): Promise<PlannerResponse>;
};

export type OpenClawCommandResult = {
  stdout: string;
  stderr: string;
};

export type OpenClawCommandRunner = (
  command: string,
  args: string[],
  options: { timeoutMs: number },
) => Promise<OpenClawCommandResult>;

export type OpenClawCliAdapterOptions = {
  command?: string;
  agent?: string;
  sessionKey?: string;
  timeoutSeconds?: number;
  thinking?: "none" | "low" | "medium" | "high";
  local?: boolean;
  extraArgs?: string[];
  commandRunner?: OpenClawCommandRunner;
};

const openClawThinkingLevels = new Set(["none", "low", "medium", "high"]);

function buildSessionKey(): string {
  return `essenplanner:planner:${new Date().toISOString()}`;
}

function readOpenClawTimeout(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 60 || timeout > 1200) {
    throw new Error("OPENCLAW_TIMEOUT_SECONDS must be an integer between 60 and 1200.");
  }

  return timeout;
}

function readOpenClawThinking(value: string | undefined): OpenClawCliAdapterOptions["thinking"] {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  if (!openClawThinkingLevels.has(value)) {
    throw new Error("OPENCLAW_THINKING must be one of none, low, medium, high.");
  }

  return value as OpenClawCliAdapterOptions["thinking"];
}

async function defaultCommandRunner(
  command: string,
  args: string[],
  options: { timeoutMs: number },
): Promise<OpenClawCommandResult> {
  try {
    return await execFile(command, args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: options.timeoutMs,
    });
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error
      ? String((error as { stderr?: unknown }).stderr ?? "").trim()
      : "";
    const message = error instanceof Error ? error.message : "OpenClaw command failed.";
    throw new Error(stderr ? `${message}: ${stderr}` : message);
  }
}

export class FixturePlannerAdapter implements PlannerAdapter {
  constructor(private readonly response: PlannerResponse = buildDemoPlannerResponse()) {}

  async createPlan(): Promise<PlannerResponse> {
    return assertPlannerResponse(this.response);
  }
}

export class OpenClawCliPlannerAdapter implements PlannerAdapter {
  private readonly options: Required<Omit<OpenClawCliAdapterOptions, "commandRunner" | "extraArgs">> & {
    extraArgs: string[];
  };

  private readonly commandRunner: OpenClawCommandRunner;

  constructor(options: OpenClawCliAdapterOptions = {}) {
    this.options = {
      command: options.command ?? "openclaw",
      agent: options.agent ?? "main",
      sessionKey: options.sessionKey ?? buildSessionKey(),
      timeoutSeconds: options.timeoutSeconds ?? 420,
      thinking: options.thinking ?? "low",
      local: options.local ?? true,
      extraArgs: options.extraArgs ?? [],
    };
    this.commandRunner = options.commandRunner ?? defaultCommandRunner;
  }

  async createPlan(request: PlannerRequest): Promise<PlannerResponse> {
    const tempDir = await mkdtemp(path.join(tmpdir(), "essenplanner-openclaw-"));
    const messagePath = path.join(tempDir, "planner-prompt.md");

    try {
      await writeFile(messagePath, buildPlannerPrompt(request), "utf8");

      const args = [
        "agent",
        ...(this.options.local ? ["--local"] : []),
        "--agent",
        this.options.agent,
        "--session-key",
        this.options.sessionKey,
        "--message-file",
        messagePath,
        "--json",
        "--timeout",
        String(this.options.timeoutSeconds),
        "--thinking",
        this.options.thinking,
        ...this.options.extraArgs,
      ];

      const result = await this.commandRunner(this.options.command, args, {
        timeoutMs: (this.options.timeoutSeconds + 5) * 1000,
      });

      return parseOpenClawPlannerResponse(result.stdout);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

export function createPlannerAdapterFromEnv(env: NodeJS.ProcessEnv = process.env): PlannerAdapter {
  const adapter = env.ESSENPLANNER_PLANNER_ADAPTER ?? "fixture";

  if (adapter === "openclaw-cli") {
    return new OpenClawCliPlannerAdapter({
      command: env.OPENCLAW_BIN,
      agent: env.OPENCLAW_AGENT,
      sessionKey: env.OPENCLAW_SESSION_KEY,
      timeoutSeconds: readOpenClawTimeout(env.OPENCLAW_TIMEOUT_SECONDS),
      thinking: readOpenClawThinking(env.OPENCLAW_THINKING),
      local: env.OPENCLAW_LOCAL === undefined ? true : env.OPENCLAW_LOCAL !== "false",
    });
  }

  if (adapter !== "fixture") {
    throw new Error("ESSENPLANNER_PLANNER_ADAPTER must be fixture or openclaw-cli.");
  }

  return new FixturePlannerAdapter();
}

export async function runPlannerJob(
  db: SqliteDatabase,
  jobId: string,
  adapter: PlannerAdapter = createPlannerAdapterFromEnv(),
): Promise<PlannerJob> {
  const job = getPlannerJob(db, jobId);
  if (!job) {
    throw new Error(`Planner job ${jobId} does not exist.`);
  }

  if (job.status === "success") {
    throw new Error(`Planner job ${jobId} already completed successfully.`);
  }

  const running = job.status === "running" ? job : startPlannerJob(db, jobId);

  try {
    const response = await adapter.createPlan(running.request as PlannerRequest);
    return completePlannerJob(db, jobId, response);
  } catch (error) {
    return failPlannerJob(db, jobId, {
      errorCode: "planner_adapter_failed",
      errorMessage: error instanceof Error ? error.message : "Planner adapter failed.",
    });
  }
}
