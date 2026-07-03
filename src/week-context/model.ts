import type { DayContext, WeekContext, WeekContextDay, Weekday } from "../planner/repository";
import type { PersonId } from "../profiles/repository";

export type WeekContextChoice = Extract<DayContext, "office" | "home">;

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

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getNextMonday(referenceDate = new Date()): Date {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
  return addDays(date, daysUntilMonday);
}

export function buildWeekId(weekStartDate: string): string {
  return `week-${weekStartDate}`;
}

function defaultChoiceForWeekday(weekday: Weekday): WeekContextChoice {
  return weekday === "saturday" || weekday === "sunday" ? "home" : "office";
}

export function buildDefaultWeekContext(referenceDate = new Date()): WeekContext {
  const weekStart = getNextMonday(referenceDate);
  const weekStartDate = toIsoDate(weekStart);

  return {
    weekId: buildWeekId(weekStartDate),
    weekStartDate,
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

export function validateWeekContext(context: WeekContext): string[] {
  const errors: string[] = [];

  if (!context.weekId.trim()) {
    errors.push("weekId darf nicht leer sein.");
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
  const errors = validateWeekContext(context);
  if (errors.length > 0) {
    throw new Error(`Invalid week context: ${errors.join(" ")}`);
  }

  return context;
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
