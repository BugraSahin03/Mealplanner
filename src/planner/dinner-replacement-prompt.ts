import dinnerReplacementResponseSchema from "../../schemas/dinner-replacement-response.schema.json";
import type { DinnerReplacementRequest } from "./dinner-replacement";

export function buildDinnerReplacementPrompt(request: DinnerReplacementRequest): string {
  return `You are the Essenplanner dinner replacement backend.

Return exactly one JSON object and no Markdown.

Your response MUST validate against this JSON Schema:

${JSON.stringify(dinnerReplacementResponseSchema, null, 2)}

Dinner replacement request:

${JSON.stringify(request, null, 2)}

Important rules:
- Return exactly two meals and nothing else from the week plan.
- Keep the target dayId and mealId values exactly as provided in target.days.
- Both meals must be shared dinners for Buğra and Sena with person-specific grams and rough calorie estimates.
- Use one NEW dinnerLeftovers.leftoverGroupId for both meals, never target.leftoverGroupId.
- Assign exactly one role fresh_cook and one role leftover.
- plannedDayIds and plannedWeekdays must name exactly the two target days.
- For ingredient units use only: g, kg, ml, l, piece, tbsp, tsp, pack, can, jar, bottle. Never use German labels such as Stück, EL, TL, Dose, or Packung.
- Do not propose any excludedDinners or close variants based on title, core ingredients, or protein source.
- Respect profiles, planningHistory, otherDinners, and dinner leftover rules.
- Write user-facing content in German.
`;
}
