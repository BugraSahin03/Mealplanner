import { readFileSync } from "node:fs";

const requestPath = process.argv[2] ?? "fixtures/planner-request.sample.json";
const request = readFileSync(requestPath, "utf8");
const responseSchema = readFileSync("schemas/planner-response.schema.json", "utf8");

const prompt = `You are the Essenplanner planning backend.

Return exactly one JSON object and no Markdown.

Your response MUST validate against the following JSON Schema:

${responseSchema}

Planner request:

${request}

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
- Write all user-facing titles, descriptions, notes, plannerNotes, warnings, prepNotes, and buyingHint values in German.
`;

process.stdout.write(prompt);
