import type { SqliteDatabase } from "../db/sqlite";
import {
  getLatestPlannerJobForWeek,
  getWeekContext,
  listWeekContexts,
  type PlannerJob,
  type WeekContext,
} from "../planner/repository";
import {
  addDays,
  buildWeekContextForStartDate,
  getIsoWeekStart,
  getWeekStartDateFromWeekId,
  toIsoDate,
} from "./model";

export type WeekBucket = "current" | "planned" | "past";
export type WeekStatus = "draft" | "planned" | "shopping_ready" | "completed";

export type WeekSummary = {
  context: WeekContext;
  bucket: WeekBucket;
  status: WeekStatus;
  homeOfficeReady: boolean;
  hasPlannerJob: boolean;
  hasWeekPlan: boolean;
  hasShoppingList: boolean;
};

export type WeekSwitcherState = {
  previous: WeekContext;
  current: WeekContext;
  next: WeekContext;
};

const statusLabels: Record<WeekStatus, string> = {
  draft: "Entwurf",
  planned: "Geplant",
  shopping_ready: "Einkauf bereit",
  completed: "Abgeschlossen",
};

export function getWeekStatusLabel(status: WeekStatus): string {
  return statusLabels[status];
}

export function getWeekDateRange(context: WeekContext, options: { withYear?: boolean } = {}): string {
  const firstDate = context.weekStartDate
    ? new Date(`${context.weekStartDate}T00:00:00`)
    : getWeekStartDateFromWeekId(context.weekId);
  if (!firstDate) {
    return "Datum offen";
  }

  const lastDate = addDays(firstDate, 6);
  const formatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    ...(options.withYear ? { year: "numeric" } : {}),
  });

  return `${formatter.format(firstDate)} - ${formatter.format(lastDate)}`;
}

export function getWeekLabel(context: WeekContext, options: { withYear?: boolean } = {}): string {
  const year = options.withYear ? `${context.calendarYear} / ` : "";
  return `${year}KW ${context.calendarWeek} · ${getWeekDateRange(context, options)}`;
}

function hasHomeOfficeContext(context: WeekContext | null): boolean {
  return (context?.days.length ?? 0) > 0;
}

function hasShoppingList(job: PlannerJob | null): boolean {
  if (job?.status !== "success" || !job.response || typeof job.response !== "object") {
    return false;
  }

  const shoppingList = (job.response as { shoppingList?: unknown }).shoppingList;
  return Array.isArray(shoppingList) && shoppingList.length > 0;
}

function resolveStatus(
  bucket: WeekBucket,
  job: PlannerJob | null,
): WeekStatus {
  if (bucket === "past") {
    return "completed";
  }

  if (hasShoppingList(job)) {
    return "shopping_ready";
  }

  if (job?.status === "success") {
    return "planned";
  }

  return "draft";
}

function bucketForWeek(weekStartDate: string, currentWeekStartDate: string): WeekBucket {
  if (weekStartDate === currentWeekStartDate) {
    return "current";
  }

  return weekStartDate > currentWeekStartDate ? "planned" : "past";
}

export function buildWeekContextFromWeekId(weekId: string): WeekContext | null {
  const weekStart = getWeekStartDateFromWeekId(weekId);
  return weekStart ? buildWeekContextForStartDate(weekStart) : null;
}

export function buildWeekSwitcherState(context: WeekContext): WeekSwitcherState {
  const currentStart = context.weekStartDate
    ? new Date(`${context.weekStartDate}T00:00:00`)
    : getWeekStartDateFromWeekId(context.weekId) ?? getIsoWeekStart();

  return {
    previous: buildWeekContextForStartDate(addDays(currentStart, -7)),
    current: context,
    next: buildWeekContextForStartDate(addDays(currentStart, 7)),
  };
}

export function buildWeekSummaries(
  db: SqliteDatabase,
  referenceDate = new Date(),
): WeekSummary[] {
  const currentWeekStart = getIsoWeekStart(referenceDate);
  const currentWeekStartDate = toIsoDate(currentWeekStart);
  const generated = new Map<string, WeekContext>();

  for (let offset = -4; offset <= 4; offset += 1) {
    const context = buildWeekContextForStartDate(addDays(currentWeekStart, offset * 7));
    generated.set(context.weekId, context);
  }

  for (const saved of listWeekContexts(db)) {
    generated.set(saved.weekId, saved);
  }

  return Array.from(generated.values())
    .map((generatedContext) => {
      const savedContext = getWeekContext(db, generatedContext.weekId);
      const context = savedContext ?? generatedContext;
      const weekStartDate = context.weekStartDate ?? toIsoDate(getWeekStartDateFromWeekId(context.weekId) ?? currentWeekStart);
      const bucket = bucketForWeek(weekStartDate, currentWeekStartDate);
      const latestJob = getLatestPlannerJobForWeek(db, context.weekId);

      return {
        context,
        bucket,
        status: resolveStatus(bucket, latestJob),
        homeOfficeReady: hasHomeOfficeContext(savedContext),
        hasPlannerJob: latestJob !== null,
        hasWeekPlan: latestJob?.status === "success",
        hasShoppingList: hasShoppingList(latestJob),
      };
    })
    .sort((left, right) => {
      const leftDate = left.context.weekStartDate ?? "";
      const rightDate = right.context.weekStartDate ?? "";
      return leftDate.localeCompare(rightDate);
    });
}

export function buildWeekHref(pathname: string, weekId: string, hash = ""): string {
  return `${pathname}?week=${encodeURIComponent(weekId)}${hash}`;
}

export function resolveWeekIdFromParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && getWeekStartDateFromWeekId(value) ? value : null;
}
