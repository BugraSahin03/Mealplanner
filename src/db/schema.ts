import type { SqliteDatabase } from "./sqlite";

export type Migration = {
  id: string;
  name: string;
  sql: string;
};

const bootstrapSql = `
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

const ep002PersistenceSql = `
CREATE TABLE IF NOT EXISTS profiles (
  person_id TEXT PRIMARY KEY CHECK (person_id IN ('bugra', 'sena')),
  display_name TEXT NOT NULL,
  primary_goal TEXT NOT NULL CHECK (
    primary_goal IN ('muscle_gain', 'weight_gain', 'fat_loss', 'weight_loss', 'maintenance')
  ),
  daily_calories_target INTEGER CHECK (
    daily_calories_target IS NULL OR daily_calories_target >= 0
  ),
  preferences_json TEXT NOT NULL DEFAULT '{}',
  meal_guidance_json TEXT NOT NULL DEFAULT '{}',
  hard_rules_json TEXT NOT NULL DEFAULT '[]',
  soft_rules_json TEXT NOT NULL DEFAULT '[]',
  profile_notes_markdown TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS week_contexts (
  week_id TEXT PRIMARY KEY,
  week_start_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS week_context_person_days (
  week_id TEXT NOT NULL REFERENCES week_contexts(week_id) ON DELETE CASCADE,
  day_id TEXT NOT NULL,
  date TEXT,
  weekday TEXT NOT NULL CHECK (
    weekday IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
  ),
  person_id TEXT NOT NULL REFERENCES profiles(person_id) ON DELETE RESTRICT,
  day_context TEXT NOT NULL CHECK (day_context IN ('office', 'home', 'away', 'flex')),
  notes TEXT,
  PRIMARY KEY (week_id, day_id, person_id)
);

CREATE TABLE IF NOT EXISTS planner_jobs (
  job_id TEXT PRIMARY KEY,
  week_id TEXT REFERENCES week_contexts(week_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'success', 'failed')),
  request_json TEXT NOT NULL,
  response_json TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS week_plans (
  plan_id TEXT PRIMARY KEY,
  week_id TEXT REFERENCES week_contexts(week_id) ON DELETE SET NULL,
  planner_job_id TEXT REFERENCES planner_jobs(job_id) ON DELETE SET NULL,
  title TEXT,
  summary TEXT,
  plan_json TEXT NOT NULL,
  shopping_list_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS planned_meals (
  meal_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES week_plans(plan_id) ON DELETE CASCADE,
  day_id TEXT NOT NULL,
  weekday TEXT NOT NULL CHECK (
    weekday IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
  ),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  title TEXT NOT NULL,
  context TEXT NOT NULL CHECK (context IN ('office', 'home', 'shared', 'meal_prep', 'flex')),
  people_json TEXT NOT NULL,
  ingredients_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id TEXT NOT NULL REFERENCES week_plans(plan_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  unit TEXT NOT NULL,
  category TEXT,
  source_meal_ids_json TEXT NOT NULL DEFAULT '[]',
  pantry_item INTEGER NOT NULL DEFAULT 0 CHECK (pantry_item IN (0, 1)),
  optional INTEGER NOT NULL DEFAULT 0 CHECK (optional IN (0, 1)),
  buying_hint TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_week_context_days_week_id
ON week_context_person_days(week_id);

CREATE INDEX IF NOT EXISTS idx_planner_jobs_status
ON planner_jobs(status);

CREATE INDEX IF NOT EXISTS idx_planner_jobs_week_id
ON planner_jobs(week_id);

CREATE INDEX IF NOT EXISTS idx_week_plans_week_id
ON week_plans(week_id);

CREATE INDEX IF NOT EXISTS idx_planned_meals_plan_day
ON planned_meals(plan_id, day_id);

CREATE INDEX IF NOT EXISTS idx_shopping_items_plan_id
ON shopping_items(plan_id);

INSERT INTO profiles (person_id, display_name, primary_goal, preferences_json, meal_guidance_json, hard_rules_json, soft_rules_json)
VALUES
  ('bugra', 'Buğra', 'muscle_gain', '{}', '{}', '[]', '["proteinreich planen"]'),
  ('sena', 'Sena', 'weight_loss', '{}', '{}', '[]', '["kalorienbewusst planen"]')
ON CONFLICT(person_id) DO NOTHING;
`;

export const migrations: Migration[] = [
  {
    id: "0001_ep_002",
    name: "core planner persistence",
    sql: ep002PersistenceSql,
  },
];

export function getLatestSchemaVersion(): string {
  return migrations.at(-1)?.id ?? "bootstrap";
}

export function applyMigrations(db: SqliteDatabase): void {
  db.exec(bootstrapSql);

  const appliedRows = db
    .prepare("SELECT id FROM schema_migrations")
    .all() as Array<{ id: string }>;
  const applied = new Set(appliedRows.map((row) => row.id));

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    db.exec("BEGIN;");
    try {
      db.exec(migration.sql);
      db.prepare("INSERT INTO schema_migrations (id, name) VALUES (?, ?)").run(
        migration.id,
        migration.name,
      );
      db.prepare(
        `
          INSERT INTO app_meta (key, value)
          VALUES ('schema_version', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `,
      ).run(migration.id);
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }
  }
}
