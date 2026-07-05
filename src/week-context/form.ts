import type { WeekContext } from "../planner/repository";
import type { PersonId } from "../profiles/repository";
import {
  buildDefaultWeekContext,
  buildWeekIdFromStartDate,
  ensureCompleteWeekContext,
  normalizeHomeOfficeTargets,
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

function readTarget(formData: FormData, personId: PersonId): number {
  const value = Number(readRequiredString(formData, `homeOfficeTarget.${personId}`));
  return Number.isFinite(value) ? value : 2;
}

function readTargetDelta(formData: FormData, personId: PersonId): number {
  const value = Number(readRequiredString(formData, `targetDelta.${personId}`));
  return Number.isFinite(value) ? value : 0;
}

export function buildWeekContextFromFormData(formData: FormData): WeekContext {
  const weekStartDate = readRequiredString(formData, "weekStartDate");
  const fallback = buildDefaultWeekContext();
  const effectiveWeekStartDate = weekStartDate || fallback.weekStartDate;
  const baseTargets = normalizeHomeOfficeTargets({
    bugra: readTarget(formData, "bugra"),
    sena: readTarget(formData, "sena"),
  });
  const homeOfficeTargets = normalizeHomeOfficeTargets({
    bugra: baseTargets.bugra + readTargetDelta(formData, "bugra"),
    sena: baseTargets.sena + readTargetDelta(formData, "sena"),
  });

  return ensureCompleteWeekContext({
    weekId: buildWeekIdFromStartDate(effectiveWeekStartDate ?? fallback.weekStartDate ?? ""),
    weekStartDate: effectiveWeekStartDate,
    homeOfficeTargets,
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
