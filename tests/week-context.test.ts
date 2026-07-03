import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/client";
import type { SqliteDatabase } from "../src/db/sqlite";
import { buildPlannerRequestFromWeekContext } from "../src/planner/request";
import { getWeekContext } from "../src/planner/repository";
import { buildWeekContextFromFormData } from "../src/week-context/form";
import { buildDefaultWeekContext, validateWeekContext } from "../src/week-context/model";
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

    expect(context.weekStartDate).toBe("2026-07-06");
    expect(context.days).toHaveLength(14);
    expect(validateWeekContext(context)).toEqual([]);
    expect(
      context.days
        .filter((day) => day.weekday === "saturday" || day.weekday === "sunday")
        .map((day) => day.dayContext),
    ).toEqual(["home", "home", "home", "home"]);
    expect(context.days.filter((day) => day.dayContext === "office")).toHaveLength(10);
  });

  it("parses form data and saves the weekly office/home choices", () => {
    const formData = new FormData();
    formData.set("weekStartDate", "2026-07-06");

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

    const saved = getWeekContext(db, "week-2026-07-06");

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

  it("maps saved week context and profiles into a planner request", () => {
    const context = buildDefaultWeekContext(new Date("2026-07-03T12:00:00+02:00"));
    const saved = saveCurrentWeekContext(db, context);
    const request = buildPlannerRequestFromWeekContext(saved, listProfiles(db));

    expect(request).toMatchObject({
      schemaVersion: "1.0",
      week: {
        weekStartDate: "2026-07-06",
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
