import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/client";
import type { SqliteDatabase } from "../src/db/sqlite";
import { getProfile, upsertProfile } from "../src/profiles/repository";

let db: SqliteDatabase;

describe("profiles repository", () => {
  beforeEach(() => {
    db = createDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("updates structured profile fields without mixing them with markdown memory", () => {
    const saved = upsertProfile(db, {
      personId: "sena",
      displayName: "Sena",
      primaryGoal: "weight_loss",
      dailyCaloriesTarget: 1800,
      preferences: { favoriteMeals: ["Linsensuppe"] },
      mealGuidance: { lunch: "Meal Prep bevorzugen" },
      hardRules: [],
      softRules: ["kalorienbewusst planen"],
      profileNotesMarkdown: "# Sena\n\nLebende Notizen bleiben separat.",
    });

    expect(saved.dailyCaloriesTarget).toBe(1800);
    expect(saved.preferences.favoriteMeals).toEqual(["Linsensuppe"]);
    expect(saved.profileNotesMarkdown).toContain("Lebende Notizen");

    const loaded = getProfile(db, "sena");
    expect(loaded?.mealGuidance.lunch).toBe("Meal Prep bevorzugen");
  });
});
