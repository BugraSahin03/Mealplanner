import { assertPlannerResponse, type PlannerResponse } from "./response";

type OpenClawPayload = {
  text?: unknown;
};

type OpenClawOutput = {
  payloads?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseFirstJsonObject(text: string): unknown {
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== "{") {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
      const char = text[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === "\"") {
          inString = false;
        }
        continue;
      }

      if (char === "\"") {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          const candidate = text.slice(start, index + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new Error("No parseable JSON object found in OpenClaw output.");
}

export function extractOpenClawPlannerText(output: unknown): string {
  if (!isObject(output)) {
    throw new Error("OpenClaw output must be an object.");
  }

  const payloads = (output as OpenClawOutput).payloads;
  if (!Array.isArray(payloads) || payloads.length === 0) {
    throw new Error("OpenClaw output does not contain payloads[0].text.");
  }

  const firstPayload = payloads[0] as OpenClawPayload;
  if (!isObject(firstPayload) || typeof firstPayload.text !== "string") {
    throw new Error("OpenClaw output does not contain payloads[0].text.");
  }

  return firstPayload.text;
}

export function parsePlannerResponseJson(text: string): PlannerResponse {
  return assertPlannerResponse(parseFirstJsonObject(text));
}

export function parseOpenClawPlannerResponse(rawOutput: string): PlannerResponse {
  const outerOrResponse = parseFirstJsonObject(rawOutput);

  if (isObject(outerOrResponse) && Array.isArray(outerOrResponse.payloads)) {
    return parsePlannerResponseJson(extractOpenClawPlannerText(outerOrResponse));
  }

  return assertPlannerResponse(outerOrResponse);
}
