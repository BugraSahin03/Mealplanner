import { describe, expect, it } from "vitest";

import { buildHomeOverview, countOfficeSlots } from "../src/home/overview";

describe("home overview", () => {
  it("models the MVP planning flow on the start page", () => {
    const overview = buildHomeOverview();

    expect(overview.people.map((person) => person.id)).toEqual(["bugra", "sena"]);
    expect(overview.week).toHaveLength(7);
    expect(overview.meals.map((meal) => meal.slot)).toEqual([
      "Fruehstueck",
      "Mittag",
      "Abend",
    ]);
    expect(overview.shopping.map((group) => group.category)).toEqual([
      "Frische",
      "Protein",
      "Vorrat",
    ]);
  });

  it("counts person office slots across the week preview", () => {
    expect(countOfficeSlots(buildHomeOverview().week)).toBe(5);
  });
});
