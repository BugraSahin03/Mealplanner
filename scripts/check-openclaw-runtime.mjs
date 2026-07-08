import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const runSmoke = args.has("--smoke");
const command = process.env.OPENCLAW_BIN || "openclaw";
const agent = process.env.OPENCLAW_AGENT || "main";
const timeoutSeconds = process.env.OPENCLAW_TIMEOUT_SECONDS || "420";
const thinking = process.env.OPENCLAW_THINKING || "low";
const localFlag = process.env.OPENCLAW_LOCAL === "false" ? [] : ["--local"];

function run(label, cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const detail = stderr ? `\n${stderr}` : "";
    throw new Error(`${label} failed with exit code ${result.status}.${detail}`);
  }

  return result.stdout?.trim() ?? "";
}

function printCheck(label, value) {
  console.log(`${label}: ${value}`);
}

function summarizeModelsStatus(status) {
  const auth = status?.auth;
  const providers = Array.isArray(auth?.providers)
    ? auth.providers.map((entry) => ({
      provider: entry.provider,
      profileCount: entry.profiles?.count ?? 0,
      oauthProfiles: entry.profiles?.oauth ?? 0,
      tokenProfiles: entry.profiles?.token ?? 0,
      apiKeyProfiles: entry.profiles?.apiKey ?? 0,
    }))
    : [];

  return {
    defaultModel: status?.defaultModel ?? null,
    resolvedDefault: status?.resolvedDefault ?? null,
    missingProvidersInUse: auth?.missingProvidersInUse ?? [],
    providersWithOAuth: auth?.providersWithOAuth ?? [],
    unusableProfiles: auth?.unusableProfiles ?? [],
    providers,
  };
}

function checkBubblewrap() {
  const result = spawnSync("sh", ["-lc", "command -v bwrap || command -v bubblewrap"], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error("bubblewrap is missing. Install it on Ubuntu/Debian with: apt-get install -y bubblewrap");
  }

  return result.stdout.trim();
}

function buildPrompt(requestPath) {
  const request = readFileSync(requestPath, "utf8");
  const responseSchema = readFileSync("schemas/planner-response.schema.json", "utf8");

  return `You are the Essenplanner planning backend.

Return exactly one JSON object and no Markdown.

Your response MUST validate against the following JSON Schema:

${responseSchema}

Planner request:

${request}

Important rules:
- Use schemaVersion "1.0".
- Plan only the provided request days.
- Include breakfast, lunch, and dinner.
- Include ingredients for every meal.
- Consolidate ingredients into shoppingList.
- Use personId values "bugra" and "sena".
- Write all user-facing titles, descriptions, notes, plannerNotes, warnings, prepNotes, and buyingHint values in German.
`;
}

try {
  printCheck("OpenClaw command", command);

  const version = run("openclaw version", command, ["--version"]);
  printCheck("OpenClaw version", version || "ok");

  const modelsStatus = run("openclaw models status", command, ["models", "status", "--json"]);
  const parsedStatus = JSON.parse(modelsStatus);
  printCheck("OpenClaw models status", JSON.stringify(summarizeModelsStatus(parsedStatus)));

  const bubblewrapPath = checkBubblewrap();
  printCheck("bubblewrap", bubblewrapPath);

  if (runSmoke) {
    const tempDir = mkdtempSync(path.join(tmpdir(), "essenplanner-openclaw-runtime-"));
    const promptPath = path.join(tempDir, "planner-prompt.md");
    const outputPath = path.join(tempDir, "openclaw-output.jsonl");

    try {
      writeFileSync(promptPath, buildPrompt("fixtures/planner-request.sample.json"), "utf8");
      const sessionKey = `essenplanner:runtime-smoke:${new Date().toISOString()}`;
      const output = run("openclaw planner smoke", command, [
        "agent",
        ...localFlag,
        "--agent",
        agent,
        "--session-key",
        sessionKey,
        "--message-file",
        promptPath,
        "--json",
        "--timeout",
        timeoutSeconds,
        "--thinking",
        thinking,
      ]);

      writeFileSync(outputPath, output, "utf8");
      run("planner response validation", "npm", ["run", "validate:planner-response", "--", outputPath]);
      printCheck("Planner smoke", "valid planner response");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  } else {
    printCheck("Planner smoke", "skipped; pass --smoke to run a real OpenClaw planner request");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
