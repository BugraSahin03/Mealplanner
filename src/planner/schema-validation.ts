import plannerResponseSchema from "../../schemas/planner-response.schema.json";
import type { PlannerResponse } from "./response";

type JsonObject = Record<string, unknown>;

type JsonSchema = {
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  type?: "object" | "array" | "string" | "number" | "boolean";
  const?: unknown;
  enum?: unknown[];
  additionalProperties?: boolean;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  format?: string;
};

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatPath(path: string): string {
  return path || "response";
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function resolveRef(ref: string, root: JsonSchema): JsonSchema {
  const prefix = "#/$defs/";
  if (!ref.startsWith(prefix)) {
    throw new Error(`Unsupported schema reference: ${ref}`);
  }

  const key = ref.slice(prefix.length);
  const schema = root.$defs?.[key];
  if (!schema) {
    throw new Error(`Unknown schema reference: ${ref}`);
  }

  return schema;
}

function isDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}

function validateType(value: unknown, schema: JsonSchema, path: string): string[] {
  if (!schema.type) {
    return [];
  }

  if (schema.type === "object" && !isObject(value)) {
    return [`${formatPath(path)} muss ein Objekt sein.`];
  }
  if (schema.type === "array" && !Array.isArray(value)) {
    return [`${formatPath(path)} muss eine Liste sein.`];
  }
  if (schema.type === "string" && typeof value !== "string") {
    return [`${formatPath(path)} muss Text sein.`];
  }
  if (schema.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
    return [`${formatPath(path)} muss eine Zahl sein.`];
  }
  if (schema.type === "boolean" && typeof value !== "boolean") {
    return [`${formatPath(path)} muss boolean sein.`];
  }

  return [];
}

function validateAgainstSchema(
  value: unknown,
  schema: JsonSchema,
  root: JsonSchema,
  path: string,
): string[] {
  if (schema.$ref) {
    return validateAgainstSchema(value, resolveRef(schema.$ref, root), root, path);
  }

  const errors: string[] = [];
  errors.push(...validateType(value, schema, path));
  if (errors.length > 0) {
    return errors;
  }

  if (schema.const !== undefined && !valuesEqual(value, schema.const)) {
    errors.push(`${formatPath(path)} muss ${String(schema.const)} sein.`);
  }

  if (schema.enum && !schema.enum.some((option) => valuesEqual(option, value))) {
    errors.push(`${formatPath(path)} ist ungueltig.`);
  }

  if (schema.type === "number" && schema.minimum !== undefined && typeof value === "number") {
    if (value < schema.minimum) {
      errors.push(`${formatPath(path)} muss mindestens ${schema.minimum} sein.`);
    }
  }

  if (schema.type === "string" && schema.format === "date" && typeof value === "string") {
    if (!isDateString(value)) {
      errors.push(`${formatPath(path)} muss ein ISO-Datum sein.`);
    }
  }

  if (schema.type === "array" && Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${formatPath(path)} braucht mindestens ${schema.minItems} Eintraege.`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${formatPath(path)} darf maximal ${schema.maxItems} Eintraege enthalten.`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, schema.items as JsonSchema, root, `${path}[${index}]`));
      });
    }
  }

  if (schema.type === "object" && isObject(value)) {
    for (const key of schema.required ?? []) {
      if (value[key] === undefined) {
        errors.push(`${formatPath(path)}.${key} fehlt.`);
      }
    }

    const properties = schema.properties ?? {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!properties[key]) {
          errors.push(`${formatPath(path)}.${key} ist nicht erlaubt.`);
        }
      }
    }

    for (const [key, propertySchema] of Object.entries(properties)) {
      if (value[key] !== undefined) {
        errors.push(
          ...validateAgainstSchema(value[key], propertySchema, root, path ? `${path}.${key}` : key),
        );
      }
    }
  }

  return errors;
}

export function validatePlannerResponseAgainstSchema(value: unknown): string[] {
  return validateAgainstSchema(value, plannerResponseSchema as JsonSchema, plannerResponseSchema as JsonSchema, "");
}

export function assertPlannerResponseAgainstSchema(value: unknown): PlannerResponse {
  const errors = validatePlannerResponseAgainstSchema(value);
  if (errors.length > 0) {
    throw new Error(`Invalid planner response: ${errors.join(" ")}`);
  }

  return value as PlannerResponse;
}

export function getPlannerResponseSchemaForPrompt(): unknown {
  return plannerResponseSchema;
}
