import type { WeekContext } from "../planner/repository";
import type { PersonId } from "../profiles/repository";
import {
  buildDefaultWeekContext,
  buildWeekId,
  ensureCompleteWeekContext,
  weekdays,
  weekContextPeople,
  type WeekContextChoice,
} from "./model";

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readChoice(formData: FormData, weekday: string, personId: PersonId): WeekContextChoice {
  const value = readRequiredString(formData, `context.${weekday}.${personId}`);
  return value === "home" ? "home" : "office";
}

export function buildWeekContextFromFormData(formData: FormData): WeekContext {
  const weekStartDate = readRequiredString(formData, "weekStartDate");
  const fallback = buildDefaultWeekContext();
  const effectiveWeekStartDate = weekStartDate || fallback.weekStartDate;

  return ensureCompleteWeekContext({
    weekId: buildWeekId(effectiveWeekStartDate ?? ""),
    weekStartDate: effectiveWeekStartDate,
    notes: readRequiredString(formData, "notes") || null,
    days: weekdays.flatMap((day) => {
      const fallbackDay = fallback.days.find((entry) => entry.weekday === day.weekday);
      const date = readRequiredString(formData, `date.${day.weekday}`) || fallbackDay?.date || null;

      return weekContextPeople.map((person) => ({
        dayId: date ?? day.weekday,
        date,
        weekday: day.weekday,
        personId: person.personId,
        dayContext: readChoice(formData, day.weekday, person.personId),
        notes: readRequiredString(formData, `notes.${day.weekday}.${person.personId}`) || null,
      }));
    }),
  });
}
