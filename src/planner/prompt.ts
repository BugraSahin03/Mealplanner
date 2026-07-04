import { getPlannerResponseSchemaForPrompt } from "./schema-validation";
import type { PlannerRequest } from "./request";

export function buildPlannerPrompt(
  request: PlannerRequest,
  responseSchema: unknown = getPlannerResponseSchemaForPrompt(),
): string {
  return `You are the Essenplanner planning backend.

Return exactly one JSON object and no Markdown.

Your response MUST validate against the following JSON Schema:

${JSON.stringify(responseSchema, null, 2)}

Planner request:

${JSON.stringify(request, null, 2)}

Important rules:
- Use schemaVersion "1.0".
- Plan only the provided request days.
- Include breakfast, lunch, and dinner.
- Breakfast and lunch may differ per person depending on office/home context.
- Dinner should be shared when practical.
- Include ingredients for every meal.
- Consolidate ingredients into shoppingList.
- Use stable ids for dayId, mealId, and sourceMealIds.
- Use personId values "bugra" and "sena".
- Prefer practical quantities and buying hints over perfect nutrition math.
- Write all user-facing titles, descriptions, notes, plannerNotes, warnings, prepNotes, and buyingHint values in German.
`;
}
