import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const file = process.argv[2];

if (!file) {
  console.error("Usage: node scripts/validate-openclaw-planner-response.mjs <openclaw-output-or-response-json>");
  process.exit(2);
}

const raw = readFileSync(file, "utf8");
const schema = JSON.parse(readFileSync("schemas/planner-response.schema.json", "utf8"));

function parseFirstJsonObject(text) {
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== "{") continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i += 1) {
      const char = text[i];

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
          const candidate = text.slice(start, i + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new Error("No parseable JSON object found.");
}

const outerOrResponse = parseFirstJsonObject(raw);
let response = outerOrResponse;

if (Array.isArray(outerOrResponse.payloads)) {
  const text = outerOrResponse.payloads?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("OpenClaw output does not contain payloads[0].text.");
  }
  response = JSON.parse(text);
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const valid = validate(response);

if (!valid) {
  console.error("planner-response invalid");
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

const dayCount = response.plan.days.length;
const mealCount = response.plan.days.reduce((sum, day) => sum + day.meals.length, 0);
const shoppingCount = response.shoppingList.length;

console.log("planner-response valid");
console.log(JSON.stringify({ dayCount, mealCount, shoppingCount }, null, 2));
