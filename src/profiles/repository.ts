import { parseJson, stringifyJson } from "../db/json";
import type { SqliteDatabase } from "../db/sqlite";
import {
  normalizeMealGuidance,
  normalizePreferences,
  validateProfileInput,
  type PersonId,
  type PrimaryGoal,
  type Profile,
  type ProfileInput,
} from "./model";

export type { PersonId, PrimaryGoal, Profile, ProfileInput } from "./model";

type ProfileRow = {
  person_id: PersonId;
  display_name: string;
  primary_goal: PrimaryGoal;
  daily_calories_target: number | null;
  preferences_json: string;
  meal_guidance_json: string;
  hard_rules_json: string;
  soft_rules_json: string;
  profile_notes_markdown: string | null;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    personId: row.person_id,
    displayName: row.display_name,
    primaryGoal: row.primary_goal,
    dailyCaloriesTarget: row.daily_calories_target,
    preferences: normalizePreferences(parseJson(row.preferences_json, {})),
    mealGuidance: normalizeMealGuidance(parseJson(row.meal_guidance_json, {})),
    hardRules: parseJson(row.hard_rules_json, []),
    softRules: parseJson(row.soft_rules_json, []),
    profileNotesMarkdown: row.profile_notes_markdown,
  };
}

export function listProfiles(db: SqliteDatabase): Profile[] {
  return (
    db
      .prepare(
        `
          SELECT person_id, display_name, primary_goal, daily_calories_target,
                 preferences_json, meal_guidance_json, hard_rules_json,
                 soft_rules_json, profile_notes_markdown
          FROM profiles
          ORDER BY CASE person_id WHEN 'bugra' THEN 1 WHEN 'sena' THEN 2 ELSE 3 END
        `,
      )
      .all() as ProfileRow[]
  ).map(mapProfile);
}

export function getProfile(db: SqliteDatabase, personId: PersonId): Profile | null {
  const row = db
    .prepare(
      `
        SELECT person_id, display_name, primary_goal, daily_calories_target,
               preferences_json, meal_guidance_json, hard_rules_json,
               soft_rules_json, profile_notes_markdown
        FROM profiles
        WHERE person_id = ?
      `,
    )
    .get(personId) as ProfileRow | undefined;

  return row ? mapProfile(row) : null;
}

export function upsertProfile(db: SqliteDatabase, profile: ProfileInput): Profile {
  const validationErrors = validateProfileInput(profile);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid profile: ${validationErrors.join(" ")}`);
  }

  db.prepare(
    `
      INSERT INTO profiles (
        person_id, display_name, primary_goal, daily_calories_target,
        preferences_json, meal_guidance_json, hard_rules_json,
        soft_rules_json, profile_notes_markdown, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(person_id) DO UPDATE SET
        display_name = excluded.display_name,
        primary_goal = excluded.primary_goal,
        daily_calories_target = excluded.daily_calories_target,
        preferences_json = excluded.preferences_json,
        meal_guidance_json = excluded.meal_guidance_json,
        hard_rules_json = excluded.hard_rules_json,
        soft_rules_json = excluded.soft_rules_json,
        profile_notes_markdown = excluded.profile_notes_markdown,
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run(
    profile.personId,
    profile.displayName,
    profile.primaryGoal,
    profile.dailyCaloriesTarget,
    stringifyJson(profile.preferences),
    stringifyJson(profile.mealGuidance),
    stringifyJson(profile.hardRules),
    stringifyJson(profile.softRules),
    profile.profileNotesMarkdown,
  );

  const saved = getProfile(db, profile.personId);
  if (!saved) {
    throw new Error(`Profile ${profile.personId} was not saved.`);
  }

  return saved;
}
