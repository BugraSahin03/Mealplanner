import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/client";
import type { SqliteDatabase } from "../src/db/sqlite";
import { buildPlannerRequestFromWeekContext } from "../src/planner/request";
import { getWeekContext } from "../src/planner/repository";
import { buildWeekContextFromFormData } from "../src/week-context/form";
import {
  buildDefaultWeekContext,
  buildHomeOfficeTargetSummary,
  getIsoCalendarWeek,
  validateWeekContext,
} from "../src/week-context/model";
import { saveCurrentWeekContext } from "../src/week-context/repository";
import { listProfiles } from "../src/profiles/repository";

let db: SqliteDatabase;

describe("week context", () => {
  beforeEach(() => {
    db = createDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("builds a neutral seven day default week for both people", () => {
    const context = buildDefaultWeekContext(new Date("2026-07-03T12:00:00+02:00"));

    expect(context.weekId).toBe("2026-W28");
    expect(context.weekStartDate).toBe("2026-07-06");
    expect(context.calendarYear).toBe(2026);
    expect(context.calendarWeek).toBe(28);
    expect(context.homeOfficeTargets).toEqual({ bugra: 2, sena: 2 });
    expect(context.days).toHaveLength(14);
    expect(validateWeekContext(context)).toEqual([]);
    expect(
      context.days
        .filter((day) => day.weekday === "saturday" || day.weekday === "sunday")
        .map((day) => day.dayContext),
    ).toEqual(["home", "home", "home", "home"]);
    expect(buildHomeOfficeTargetSummary(context)).toEqual([
      { personId: "bugra", displayName: "Buğra", target: 2, actual: 2, isMet: true },
      { personId: "sena", displayName: "Sena", target: 2, actual: 2, isMet: true },
    ]);
  });

  it("calculates ISO calendar week across year boundaries", () => {
    expect(getIsoCalendarWeek(new Date("2026-12-31T12:00:00+01:00"))).toEqual({
      calendarYear: 2026,
      calendarWeek: 53,
    });
    expect(getIsoCalendarWeek(new Date("2027-01-04T12:00:00+01:00"))).toEqual({
      calendarYear: 2027,
      calendarWeek: 1,
    });
  });

  it("parses form data and saves the weekly office/home choices", () => {
    const formData = new FormData();
    formData.set("weekStartDate", "2026-07-06");
    formData.set("homeOfficeTarget.bugra", "2");
    formData.set("homeOfficeTarget.sena", "2");
    formData.set("targetDelta.bugra", "1");

    const datesByWeekday = {
      monday: "2026-07-06",
      tuesday: "2026-07-07",
      wednesday: "2026-07-08",
      thursday: "2026-07-09",
      friday: "2026-07-10",
      saturday: "2026-07-11",
      sunday: "2026-07-12",
    };

    for (const weekday of [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const) {
      formData.set(`date.${weekday}`, datesByWeekday[weekday]);
      formData.set(`context.${weekday}.bugra`, weekday === "monday" ? "office" : "home");
      formData.set(`context.${weekday}.sena`, "home");
    }

    const context = buildWeekContextFromFormData(formData);
    saveCurrentWeekContext(db, context);

    const saved = getWeekContext(db, "2026-W28");

    expect(saved?.calendarYear).toBe(2026);
    expect(saved?.calendarWeek).toBe(28);
    expect(saved?.homeOfficeTargets).toEqual({ bugra: 3, sena: 2 });
    expect(saved?.days).toHaveLength(14);
    expect(
      saved?.days.find((day) => day.weekday === "monday" && day.personId === "bugra")
        ?.dayContext,
    ).toBe("office");
    expect(
      saved?.days.find((day) => day.weekday === "tuesday" && day.personId === "bugra")
        ?.dayContext,
    ).toBe("home");
  });

  it("keeps home office targets independent from the actual selected days", () => {
    const formData = new FormData();
    formData.set("weekStartDate", "2026-07-06");
    formData.set("homeOfficeTarget.bugra", "3");
    formData.set("homeOfficeTarget.sena", "2");

    const datesByWeekday = {
      monday: "2026-07-06",
      tuesday: "2026-07-07",
      wednesday: "2026-07-08",
      thursday: "2026-07-09",
      friday: "2026-07-10",
      saturday: "2026-07-11",
      sunday: "2026-07-12",
    };

    for (const weekday of [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const) {
      formData.set(`date.${weekday}`, datesByWeekday[weekday]);
      formData.set(
        `context.${weekday}.bugra`,
        weekday === "wednesday" || weekday === "friday" ? "home" : "office",
      );
      formData.set(
        `context.${weekday}.sena`,
        weekday === "wednesday" || weekday === "friday" ? "home" : "office",
      );
    }

    const context = buildWeekContextFromFormData(formData);

    expect(context.homeOfficeTargets).toEqual({ bugra: 3, sena: 2 });
    expect(buildHomeOfficeTargetSummary(context)).toEqual([
      { personId: "bugra", displayName: "Buğra", target: 3, actual: 2, isMet: false },
      { personId: "sena", displayName: "Sena", target: 2, actual: 2, isMet: true },
    ]);
  });

  it("maps saved week context and profiles into a planner request", () => {
    const context = buildDefaultWeekContext(new Date("2026-07-03T12:00:00+02:00"));
    const saved = saveCurrentWeekContext(db, context);
    const request = buildPlannerRequestFromWeekContext(saved, listProfiles(db));

    expect(request).toMatchObject({
      schemaVersion: "1.0",
      week: {
        weekStartDate: "2026-07-06",
        calendarYear: 2026,
        calendarWeek: 28,
        homeOfficeTargets: { bugra: 2, sena: 2 },
      },
      planningRules: {
        mealsPerDay: ["breakfast", "lunch", "dinner"],
        shoppingMode: "weekly",
      },
    });
    expect(request.week.days).toHaveLength(7);
    expect(request.week.days[0]).toMatchObject({
      dayId: "2026-07-06",
      weekday: "monday",
      personContexts: [
        { personId: "bugra", dayContext: "office" },
        { personId: "sena", dayContext: "office" },
      ],
    });
    expect(request.people.map((person) => person.personId)).toEqual(["bugra", "sena"]);
  });
});
