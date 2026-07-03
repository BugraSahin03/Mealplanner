import { readFileSync } from "node:fs";

const request = readFileSync("fixtures/planner-request.sample.json", "utf8");
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
- Breakfast and lunch may differ per person depending on office/home context.
- Dinner should be shared when practical.
- Include ingredients for every meal.
- Consolidate ingredients into shoppingList.
- Use stable ids for dayId, mealId, and sourceMealIds.
- Use personId values "bugra" and "sena".
- Prefer practical quantities and buying hints over perfect nutrition math.
`;

process.stdout.write(prompt);
