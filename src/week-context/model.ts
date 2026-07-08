import type { DayContext, WeekContext, WeekContextDay, Weekday } from "../planner/repository";
import type { PersonId } from "../profiles/repository";

export type WeekContextChoice = Extract<DayContext, "office" | "home">;
export type HomeOfficeTargets = Record<PersonId, number>;

export type WeekdayDefinition = {
  weekday: Weekday;
  label: string;
  shortLabel: string;
};

export const weekdays: WeekdayDefinition[] = [
  { weekday: "monday", label: "Montag", shortLabel: "Mo" },
  { weekday: "tuesday", label: "Dienstag", shortLabel: "Di" },
  { weekday: "wednesday", label: "Mittwoch", shortLabel: "Mi" },
  { weekday: "thursday", label: "Donnerstag", shortLabel: "Do" },
  { weekday: "friday", label: "Freitag", shortLabel: "Fr" },
  { weekday: "saturday", label: "Samstag", shortLabel: "Sa" },
  { weekday: "sunday", label: "Sonntag", shortLabel: "So" },
];

export const weekContextPeople: Array<{ personId: PersonId; displayName: string }> = [
  { personId: "bugra", displayName: "Buğra" },
  { personId: "sena", displayName: "Sena" },
];

const personIds = new Set<PersonId>(weekContextPeople.map((person) => person.personId));
const weekdaysById = new Map(weekdays.map((day) => [day.weekday, day]));
const allowedChoices = new Set<WeekContextChoice>(["office", "home"]);
const defaultHomeOfficeTargets: HomeOfficeTargets = {
  bugra: 2,
  sena: 2,
};
const defaultLunchBatchDishCount = 2;

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getIsoWeekStart(referenceDate = new Date()): Date {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const dayNumber = date.getDay() || 7;

  return addDays(date, 1 - dayNumber);
}

export function getNextMonday(referenceDate = new Date()): Date {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
  return addDays(date, daysUntilMonday);
}

export function getIsoCalendarWeek(date: Date): { calendarYear: number; calendarWeek: number } {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const calendarYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(calendarYear, 0, 1));
  const calendarWeek = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return { calendarYear, calendarWeek };
}

export function buildWeekId(calendarYear: number, calendarWeek: number): string {
  return `${calendarYear}-W${String(calendarWeek).padStart(2, "0")}`;
}

export function parseWeekId(weekId: string): { calendarYear: number; calendarWeek: number } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId.trim());
  if (!match) {
    return null;
  }

  const calendarYear = Number(match[1]);
  const calendarWeek = Number(match[2]);
  if (!Number.isInteger(calendarYear) || !Number.isInteger(calendarWeek) || calendarWeek < 1 || calendarWeek > 53) {
    return null;
  }

  return { calendarYear, calendarWeek };
}

export function getWeekStartDateFromWeekId(weekId: string): Date | null {
  const parsed = parseWeekId(weekId);
  if (!parsed) {
    return null;
  }

  const januaryFourth = new Date(parsed.calendarYear, 0, 4);
  const firstWeekStart = getIsoWeekStart(januaryFourth);

  return addDays(firstWeekStart, (parsed.calendarWeek - 1) * 7);
}

export function buildWeekIdFromStartDate(weekStartDate: string): string {
  return buildWeekIdFromDate(new Date(`${weekStartDate}T00:00:00`));
}

export function buildWeekIdFromDate(date: Date): string {
  const { calendarYear, calendarWeek } = getIsoCalendarWeek(date);
  return buildWeekId(calendarYear, calendarWeek);
}

function defaultChoiceForWeekday(weekday: Weekday): WeekContextChoice {
  return weekday === "wednesday" || weekday === "friday" || weekday === "saturday" || weekday === "sunday"
    ? "home"
    : "office";
}

export function normalizeHomeOfficeTargets(
  targets: Partial<Record<PersonId, number>> | null | undefined,
): HomeOfficeTargets {
  return {
    bugra: Math.max(0, Math.min(5, Math.trunc(targets?.bugra ?? defaultHomeOfficeTargets.bugra))),
    sena: Math.max(0, Math.min(5, Math.trunc(targets?.sena ?? defaultHomeOfficeTargets.sena))),
  };
}

export function normalizeLunchBatchDishCount(value: number | null | undefined): number {
  const count = Number.isFinite(value) ? Math.trunc(value ?? defaultLunchBatchDishCount) : defaultLunchBatchDishCount;

  return Math.max(1, Math.min(5, count));
}

export function buildWeekContextForStartDate(weekStart: Date): WeekContext {
  const weekStartDate = toIsoDate(weekStart);
  const { calendarYear, calendarWeek } = getIsoCalendarWeek(weekStart);

  return {
    weekId: buildWeekId(calendarYear, calendarWeek),
    weekStartDate,
    calendarYear,
    calendarWeek,
    homeOfficeTargets: defaultHomeOfficeTargets,
    lunchBatchDishCount: defaultLunchBatchDishCount,
    notes: null,
    days: weekdays.flatMap((day, index) => {
      const date = toIsoDate(addDays(weekStart, index));

      return weekContextPeople.map<WeekContextDay>((person) => ({
        dayId: date,
        date,
        weekday: day.weekday,
        personId: person.personId,
        dayContext: defaultChoiceForWeekday(day.weekday),
        notes: null,
      }));
    }),
  };
}

export function buildDefaultWeekContext(referenceDate = new Date()): WeekContext {
  return buildWeekContextForStartDate(getNextMonday(referenceDate));
}

export function validateWeekContext(context: WeekContext): string[] {
  const errors: string[] = [];

  if (!context.weekId.trim()) {
    errors.push("weekId darf nicht leer sein.");
  }

  if (!context.calendarYear || context.calendarYear < 2000) {
    errors.push("Kalenderjahr fehlt.");
  }

  if (!context.calendarWeek || context.calendarWeek < 1 || context.calendarWeek > 53) {
    errors.push("Kalenderwoche fehlt.");
  }

  if (context.days.length !== weekdays.length * weekContextPeople.length) {
    errors.push("Wochenkontext muss sieben Tage fuer beide Profile enthalten.");
  }

  const seen = new Set<string>();
  for (const day of context.days) {
    if (!weekdaysById.has(day.weekday)) {
      errors.push(`Ungueltiger Wochentag: ${day.weekday}.`);
    }

    if (!personIds.has(day.personId)) {
      errors.push(`Ungueltige Person: ${day.personId}.`);
    }

    if (!allowedChoices.has(day.dayContext as WeekContextChoice)) {
      errors.push("Wochenkontext erlaubt aktuell nur office oder home.");
    }

    const key = `${day.weekday}:${day.personId}`;
    if (seen.has(key)) {
      errors.push(`Doppelter Kontext fuer ${key}.`);
    }
    seen.add(key);
  }

  for (const day of weekdays) {
    for (const person of weekContextPeople) {
      if (!seen.has(`${day.weekday}:${person.personId}`)) {
        errors.push(`${day.label} fehlt fuer ${person.displayName}.`);
      }
    }
  }

  return errors;
}

export function ensureCompleteWeekContext(context: WeekContext): WeekContext {
  const weekStartDate = context.weekStartDate ?? buildDefaultWeekContext().weekStartDate;
  const calendar = weekStartDate
    ? getIsoCalendarWeek(new Date(`${weekStartDate}T00:00:00`))
    : { calendarYear: context.calendarYear ?? new Date().getFullYear(), calendarWeek: context.calendarWeek ?? 1 };
  const completeContext: WeekContext = {
    ...context,
    weekId: context.weekId || buildWeekId(calendar.calendarYear, calendar.calendarWeek),
    weekStartDate,
    calendarYear: context.calendarYear ?? calendar.calendarYear,
    calendarWeek: context.calendarWeek ?? calendar.calendarWeek,
    homeOfficeTargets: normalizeHomeOfficeTargets(context.homeOfficeTargets),
    lunchBatchDishCount: normalizeLunchBatchDishCount(context.lunchBatchDishCount),
  };
  const errors = validateWeekContext(completeContext);
  if (errors.length > 0) {
    throw new Error(`Invalid week context: ${errors.join(" ")}`);
  }

  return completeContext;
}

export function getContextForDay(
  context: WeekContext,
  weekday: Weekday,
  personId: PersonId,
): WeekContextChoice {
  const day = context.days.find(
    (entry) => entry.weekday === weekday && entry.personId === personId,
  );

  if (day?.dayContext === "office" || day?.dayContext === "home") {
    return day.dayContext;
  }

  return defaultChoiceForWeekday(weekday);
}

export function countHomeOfficeWeekdays(
  context: WeekContext,
  personId: PersonId,
): number {
  return context.days.filter(
    (day) =>
      day.personId === personId
      && day.dayContext === "home"
      && day.weekday !== "saturday"
      && day.weekday !== "sunday",
  ).length;
}

export function buildHomeOfficeTargetSummary(context: WeekContext): Array<{
  personId: PersonId;
  displayName: string;
  target: number;
  actual: number;
  isMet: boolean;
}> {
  const targets = normalizeHomeOfficeTargets(context.homeOfficeTargets);

  return weekContextPeople.map((person) => {
    const actual = countHomeOfficeWeekdays(context, person.personId);
    const target = targets[person.personId];

    return {
      personId: person.personId,
      displayName: person.displayName,
      target,
      actual,
      isMet: actual === target,
    };
  });
}
