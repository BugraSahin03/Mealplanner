import { randomUUID } from "node:crypto";

import { parseJson, stringifyJson } from "../db/json";
import type { SqliteDatabase } from "../db/sqlite";
import type { PersonId } from "../profiles/repository";
import { assertPlannerResponse } from "./response";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayContext = "office" | "home" | "away" | "flex";
export type PlannerJobStatus = "idle" | "running" | "success" | "failed";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealContext = "office" | "home" | "shared" | "meal_prep" | "flex";

export type WeekContextDay = {
  dayId: string;
  date?: string | null;
  weekday: Weekday;
  personId: PersonId;
  dayContext: DayContext;
  notes?: string | null;
};

export type WeekContext = {
  weekId: string;
  weekStartDate?: string | null;
  calendarYear?: number | null;
  calendarWeek?: number | null;
  homeOfficeTargets?: Partial<Record<PersonId, number>> | null;
  lunchBatchDishCount?: number | null;
  notes?: string | null;
  days: WeekContextDay[];
};

export type PlannerJob = {
  jobId: string;
  weekId: string | null;
  status: PlannerJobStatus;
  request: unknown;
  response: unknown | null;
  errorMessage: string | null;
  errorCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
};

export type PlannerMeal = {
  mealId: string;
  dayId: string;
  weekday: Weekday;
  mealType: MealType;
  title: string;
  context: MealContext;
  people: unknown[];
  ingredients: unknown[];
};

export type ShoppingItem = {
  name: string;
  amount: number;
  unit: string;
  category?: string | null;
  sourceMealIds?: string[];
  pantryItem?: boolean;
  optional?: boolean;
  buyingHint?: string | null;
  notes?: string | null;
};

export type WeekPlanInput = {
  planId: string;
  weekId?: string | null;
  plannerJobId?: string | null;
  title?: string | null;
  summary?: string | null;
  plan: unknown;
  shoppingList: ShoppingItem[];
  meals: PlannerMeal[];
};

export type WeekPlan = WeekPlanInput & {
  weekId: string | null;
  plannerJobId: string | null;
  title: string | null;
  summary: string | null;
};

type WeekContextRow = {
  week_id: string;
  week_start_date: string | null;
  calendar_year: number | null;
  calendar_week: number | null;
  home_office_targets_json: string | null;
  lunch_batch_dish_count: number | null;
  notes: string | null;
};

type WeekContextDayRow = {
  day_id: string;
  date: string | null;
  weekday: Weekday;
  person_id: PersonId;
  day_context: DayContext;
  notes: string | null;
};

type PlannerJobRow = {
  job_id: string;
  week_id: string | null;
  status: PlannerJobStatus;
  request_json: string;
  response_json: string | null;
  error_message: string | null;
  error_code: string | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
};

type WeekPlanRow = {
  plan_id: string;
  week_id: string | null;
  planner_job_id: string | null;
  title: string | null;
  summary: string | null;
  plan_json: string;
  shopping_list_json: string;
};

type PlannerMealRow = {
  meal_id: string;
  day_id: string;
  weekday: Weekday;
  meal_type: MealType;
  title: string;
  context: MealContext;
  people_json: string;
  ingredients_json: string;
};

export function saveWeekContext(db: SqliteDatabase, context: WeekContext): WeekContext {
  db.exec("BEGIN;");
  try {
    db.prepare(
      `
        INSERT INTO week_contexts (
          week_id, week_start_date, calendar_year, calendar_week,
          home_office_targets_json, lunch_batch_dish_count, notes, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(week_id) DO UPDATE SET
          week_start_date = excluded.week_start_date,
          calendar_year = excluded.calendar_year,
          calendar_week = excluded.calendar_week,
          home_office_targets_json = excluded.home_office_targets_json,
          lunch_batch_dish_count = excluded.lunch_batch_dish_count,
          notes = excluded.notes,
          updated_at = CURRENT_TIMESTAMP
      `,
    ).run(
      context.weekId,
      context.weekStartDate ?? null,
      context.calendarYear ?? null,
      context.calendarWeek ?? null,
      stringifyJson(context.homeOfficeTargets ?? {}),
      context.lunchBatchDishCount ?? 2,
      context.notes ?? null,
    );

    db.prepare("DELETE FROM week_context_person_days WHERE week_id = ?").run(
      context.weekId,
    );

    const insertDay = db.prepare(
      `
        INSERT INTO week_context_person_days (
          week_id, day_id, date, weekday, person_id, day_context, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    );

    for (const day of context.days) {
      insertDay.run(
        context.weekId,
        day.dayId,
        day.date ?? null,
        day.weekday,
        day.personId,
        day.dayContext,
        day.notes ?? null,
      );
    }

    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  const saved = getWeekContext(db, context.weekId);
  if (!saved) {
    throw new Error(`Week context ${context.weekId} was not saved.`);
  }

  return saved;
}

export function getWeekContext(db: SqliteDatabase, weekId: string): WeekContext | null {
  const row = db
    .prepare(
      `
        SELECT week_id, week_start_date, calendar_year, calendar_week,
               home_office_targets_json, lunch_batch_dish_count, notes
        FROM week_contexts
        WHERE week_id = ?
      `,
    )
    .get(weekId) as WeekContextRow | undefined;

  if (!row) {
    return null;
  }

  const days = db
    .prepare(
      `
        SELECT day_id, date, weekday, person_id, day_context, notes
        FROM week_context_person_days
        WHERE week_id = ?
        ORDER BY day_id, person_id
      `,
    )
    .all(weekId) as WeekContextDayRow[];

  return {
    weekId: row.week_id,
    weekStartDate: row.week_start_date,
    calendarYear: row.calendar_year,
    calendarWeek: row.calendar_week,
    homeOfficeTargets: parseJson(row.home_office_targets_json ?? "{}", {}),
    lunchBatchDishCount: row.lunch_batch_dish_count,
    notes: row.notes,
    days: days.map((day) => ({
      dayId: day.day_id,
      date: day.date,
      weekday: day.weekday,
      personId: day.person_id,
      dayContext: day.day_context,
      notes: day.notes,
    })),
  };
}

export function listWeekContexts(db: SqliteDatabase): WeekContext[] {
  const rows = db
    .prepare(
      `
        SELECT week_id
        FROM week_contexts
        ORDER BY week_start_date DESC, week_id DESC
      `,
    )
    .all() as Array<{ week_id: string }>;

  return rows.flatMap((row) => {
    const context = getWeekContext(db, row.week_id);
    return context ? [context] : [];
  });
}

export function createPlannerJob(
  db: SqliteDatabase,
  input: {
    jobId?: string;
    weekId?: string | null;
    request: unknown;
  },
): PlannerJob {
  const jobId = input.jobId ?? randomUUID();

  db.prepare(
    `
      INSERT INTO planner_jobs (job_id, week_id, status, request_json, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
  ).run(jobId, input.weekId ?? null, "idle", stringifyJson(input.request));

  const job = getPlannerJob(db, jobId);
  if (!job) {
    throw new Error(`Planner job ${jobId} was not saved.`);
  }

  return job;
}

function assertPlannerJobTransition(
  currentStatus: PlannerJobStatus,
  nextStatus: PlannerJobStatus,
): void {
  const allowed: Record<PlannerJobStatus, PlannerJobStatus[]> = {
    idle: ["running", "failed"],
    running: ["success", "failed"],
    success: [],
    failed: ["running"],
  };

  if (!allowed[currentStatus].includes(nextStatus)) {
    throw new Error(`Invalid planner job transition: ${currentStatus} -> ${nextStatus}.`);
  }
}

export function updatePlannerJobStatus(
  db: SqliteDatabase,
  jobId: string,
  status: PlannerJobStatus,
  details: {
    response?: unknown;
    errorMessage?: string | null;
    errorCode?: string | null;
  } = {},
): PlannerJob {
  const current = getPlannerJob(db, jobId);
  if (!current) {
    throw new Error(`Planner job ${jobId} does not exist.`);
  }
  assertPlannerJobTransition(current.status, status);

  if (status === "success") {
    assertPlannerResponse(details.response);
  }

  const completedAtSql = status === "success" || status === "failed" ? "CURRENT_TIMESTAMP" : "NULL";

  db.prepare(
    `
      UPDATE planner_jobs
      SET status = ?,
          response_json = ?,
          error_message = ?,
          error_code = ?,
          completed_at = ${completedAtSql},
          updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ?
    `,
  ).run(
    status,
    details.response === undefined ? null : stringifyJson(details.response),
    status === "failed" ? details.errorMessage ?? "Planner job failed." : null,
    status === "failed" ? details.errorCode ?? "planner_failed" : null,
    jobId,
  );

  const job = getPlannerJob(db, jobId);
  if (!job) {
    throw new Error(`Planner job ${jobId} does not exist.`);
  }

  return job;
}

export function startPlannerJob(db: SqliteDatabase, jobId: string): PlannerJob {
  return updatePlannerJobStatus(db, jobId, "running");
}

export function completePlannerJob(
  db: SqliteDatabase,
  jobId: string,
  response: unknown,
): PlannerJob {
  return updatePlannerJobStatus(db, jobId, "success", { response });
}

export function failPlannerJob(
  db: SqliteDatabase,
  jobId: string,
  details: { errorMessage: string; errorCode?: string | null },
): PlannerJob {
  return updatePlannerJobStatus(db, jobId, "failed", details);
}

export function getPlannerJob(db: SqliteDatabase, jobId: string): PlannerJob | null {
  const row = db
    .prepare(
      `
        SELECT job_id, week_id, status, request_json, response_json, error_message, completed_at
             , error_code, created_at, updated_at
        FROM planner_jobs
        WHERE job_id = ?
      `,
    )
    .get(jobId) as PlannerJobRow | undefined;

  if (!row) {
    return null;
  }

  return {
    jobId: row.job_id,
    weekId: row.week_id,
    status: row.status,
    request: parseJson(row.request_json, null),
    response: row.response_json ? parseJson(row.response_json, null) : null,
    errorMessage: row.error_message,
    errorCode: row.error_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export function listPlannerJobs(db: SqliteDatabase, limit = 10): PlannerJob[] {
  const rows = db
    .prepare(
      `
        SELECT job_id, week_id, status, request_json, response_json, error_message,
               error_code, created_at, updated_at, completed_at
        FROM planner_jobs
        ORDER BY created_at DESC, rowid DESC
        LIMIT ?
      `,
    )
    .all(limit) as PlannerJobRow[];

  return rows.map((row) => ({
    jobId: row.job_id,
    weekId: row.week_id,
    status: row.status,
    request: parseJson(row.request_json, null),
    response: row.response_json ? parseJson(row.response_json, null) : null,
    errorMessage: row.error_message,
    errorCode: row.error_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  }));
}

export function getLatestPlannerJob(db: SqliteDatabase): PlannerJob | null {
  return listPlannerJobs(db, 1)[0] ?? null;
}

export function listPlannerJobsForWeek(
  db: SqliteDatabase,
  weekId: string,
  limit = 10,
): PlannerJob[] {
  const rows = db
    .prepare(
      `
        SELECT job_id, week_id, status, request_json, response_json, error_message,
               error_code, created_at, updated_at, completed_at
        FROM planner_jobs
        WHERE week_id = ?
        ORDER BY created_at DESC, rowid DESC
        LIMIT ?
      `,
    )
    .all(weekId, limit) as PlannerJobRow[];

  return rows.map((row) => ({
    jobId: row.job_id,
    weekId: row.week_id,
    status: row.status,
    request: parseJson(row.request_json, null),
    response: row.response_json ? parseJson(row.response_json, null) : null,
    errorMessage: row.error_message,
    errorCode: row.error_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  }));
}

export function getLatestPlannerJobForWeek(
  db: SqliteDatabase,
  weekId: string,
): PlannerJob | null {
  return listPlannerJobsForWeek(db, weekId, 1)[0] ?? null;
}

export function getLatestSuccessfulPlannerJobForWeek(
  db: SqliteDatabase,
  weekId: string,
): PlannerJob | null {
  const rows = db
    .prepare(
      `
        SELECT job_id, week_id, status, request_json, response_json, error_message,
               error_code, created_at, updated_at, completed_at
        FROM planner_jobs
        WHERE week_id = ?
          AND status = 'success'
        ORDER BY completed_at DESC, created_at DESC, rowid DESC
        LIMIT 1
      `,
    )
    .all(weekId) as PlannerJobRow[];

  return rows.map((row) => ({
    jobId: row.job_id,
    weekId: row.week_id,
    status: row.status,
    request: parseJson(row.request_json, null),
    response: row.response_json ? parseJson(row.response_json, null) : null,
    errorMessage: row.error_message,
    errorCode: row.error_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  }))[0] ?? null;
}

export function saveWeekPlan(db: SqliteDatabase, input: WeekPlanInput): WeekPlan {
  db.exec("BEGIN;");
  try {
    db.prepare(
      `
        INSERT INTO week_plans (
          plan_id, week_id, planner_job_id, title, summary, plan_json, shopping_list_json, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(plan_id) DO UPDATE SET
          week_id = excluded.week_id,
          planner_job_id = excluded.planner_job_id,
          title = excluded.title,
          summary = excluded.summary,
          plan_json = excluded.plan_json,
          shopping_list_json = excluded.shopping_list_json,
          updated_at = CURRENT_TIMESTAMP
      `,
    ).run(
      input.planId,
      input.weekId ?? null,
      input.plannerJobId ?? null,
      input.title ?? null,
      input.summary ?? null,
      stringifyJson(input.plan),
      stringifyJson(input.shoppingList),
    );

    db.prepare("DELETE FROM planned_meals WHERE plan_id = ?").run(input.planId);
    db.prepare("DELETE FROM shopping_items WHERE plan_id = ?").run(input.planId);

    const insertMeal = db.prepare(
      `
        INSERT INTO planned_meals (
          meal_id, plan_id, day_id, weekday, meal_type, title, context,
          people_json, ingredients_json, sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    );
    input.meals.forEach((meal, index) => {
      insertMeal.run(
        meal.mealId,
        input.planId,
        meal.dayId,
        meal.weekday,
        meal.mealType,
        meal.title,
        meal.context,
        stringifyJson(meal.people),
        stringifyJson(meal.ingredients),
        index,
      );
    });

    const insertShoppingItem = db.prepare(
      `
        INSERT INTO shopping_items (
          plan_id, name, amount, unit, category, source_meal_ids_json,
          pantry_item, optional, buying_hint, notes, sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    );
    input.shoppingList.forEach((item, index) => {
      insertShoppingItem.run(
        input.planId,
        item.name,
        item.amount,
        item.unit,
        item.category ?? null,
        stringifyJson(item.sourceMealIds ?? []),
        item.pantryItem ? 1 : 0,
        item.optional ? 1 : 0,
        item.buyingHint ?? null,
        item.notes ?? null,
        index,
      );
    });

    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  const saved = getWeekPlan(db, input.planId);
  if (!saved) {
    throw new Error(`Week plan ${input.planId} was not saved.`);
  }

  return saved;
}

export function getWeekPlan(db: SqliteDatabase, planId: string): WeekPlan | null {
  const row = db
    .prepare(
      `
        SELECT plan_id, week_id, planner_job_id, title, summary, plan_json, shopping_list_json
        FROM week_plans
        WHERE plan_id = ?
      `,
    )
    .get(planId) as WeekPlanRow | undefined;

  if (!row) {
    return null;
  }

  const meals = db
    .prepare(
      `
        SELECT meal_id, day_id, weekday, meal_type, title, context, people_json, ingredients_json
        FROM planned_meals
        WHERE plan_id = ?
        ORDER BY sort_order
      `,
    )
    .all(planId) as PlannerMealRow[];

  return {
    planId: row.plan_id,
    weekId: row.week_id,
    plannerJobId: row.planner_job_id,
    title: row.title,
    summary: row.summary,
    plan: parseJson(row.plan_json, null),
    shoppingList: parseJson(row.shopping_list_json, []),
    meals: meals.map((meal) => ({
      mealId: meal.meal_id,
      dayId: meal.day_id,
      weekday: meal.weekday,
      mealType: meal.meal_type,
      title: meal.title,
      context: meal.context,
      people: parseJson(meal.people_json, []),
      ingredients: parseJson(meal.ingredients_json, []),
    })),
  };
}
