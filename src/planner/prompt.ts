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
- Prefer separate breakfast and lunch meal objects per person when their goals, preferences, portions, or office/home context differ.
- Breakfast and lunch may be shared only when the same meal genuinely fits both people.
- If planningRules.lunchBatchPrep.enabled is true, plan Monday-Friday lunch as batch prep with no more than planningRules.lunchBatchPrep.weekdayDishCount distinct lunch dishes across the listed weekdays.
- Reuse the same batchPrep.batchId for repeated lunch dishes, fill batchPrep.plannedDayIds/plannedWeekdays, portionCount, perPersonPortions, gramsPerPortion, estimatedKcalPerPortion, and estimatedKcalPer100g when possible.
- Buğra and Sena may share a batch lunch dish while still receiving different grams and estimated calories per portion.
- Do not add a fixed cooking or prep day to the week plan; only describe the lunch dishes, distribution, portions, grams, and rough AI calorie estimates.
- Dinner should be shared when practical.
- If planningRules.dinnerLeftoverPlanning.enabled is true, intentionally repeat shared dinners across consecutive days using planningRules.dinnerLeftoverPlanning.defaultDinnerSpanDays as the usual span.
- Mark repeated dinners with dinnerLeftovers.leftoverGroupId and dinnerLeftovers.role values "fresh_cook" and "leftover" so the app can show which dinner days belong together.
- Include ingredients for every meal.
- Consolidate ingredients into shoppingList.
- Use stable ids for dayId, mealId, and sourceMealIds.
- Use personId values "bugra" and "sena".
- Prefer practical quantities and buying hints over perfect nutrition math.
- If planningHistory is present, use it as the source of truth for recent meal variety.
- Do not repeat an identical lunch or dinner from either of the two most recent history weeks unless a hard profile rule, budget, batch-prep, or leftover requirement makes it necessary. State that reason in warnings or plannerNotes.
- Avoid meals from the older history weeks when a practical alternative exists.
- Compare normalizedTitle, coreIngredients, and proteinSource together: treat close variants such as baked salmon with potatoes and salmon with potatoes and broccoli as recent repeats, not as distinct ideas.
- Rotate lunch and dinner protein sources, cuisines, and preparation styles across recent weeks where the other planning rules permit it.
- For breakfast, use the softer person-specific rule: do not repeat the same breakfast variant for the same person in two consecutive weeks when a practical alternative exists.
- A dinner leftover group in planningHistory represents one dish, not multiple distinct dinners.
- Write all user-facing titles, descriptions, notes, plannerNotes, warnings, prepNotes, and buyingHint values in German.
`;
}
