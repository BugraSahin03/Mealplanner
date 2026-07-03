import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Usage: node scripts/validate-planner-request.mjs <planner-request-json> [...]");
  process.exit(2);
}

const profileSchema = JSON.parse(readFileSync("schemas/profile.schema.json", "utf8"));
const requestSchema = JSON.parse(readFileSync("schemas/planner-request.schema.json", "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(profileSchema);

const validate = ajv.compile(requestSchema);

for (const file of files) {
  const request = JSON.parse(readFileSync(file, "utf8"));
  const valid = validate(request);

  if (!valid) {
    console.error(`${file} invalid`);
    console.error(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  }

  console.log(`${file} valid`);
}
