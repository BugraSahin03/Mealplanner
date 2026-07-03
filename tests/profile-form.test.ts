import { describe, expect, it } from "vitest";

import { buildProfileInputFromFormData, textToList } from "../src/profiles/form";
import { validateProfileInput } from "../src/profiles/model";

describe("profile form mapping", () => {
  it("parses textarea lists from line breaks and commas", () => {
    expect(textToList("Skyr\nHaferflocken, Reis\n\n")).toEqual([
      "Skyr",
      "Haferflocken",
      "Reis",
    ]);
  });

  it("builds a typed profile input from form data", () => {
    const formData = new FormData();
    formData.set("personId", "bugra");
    formData.set("displayName", "Buğra");
    formData.set("primaryGoal", "muscle_gain");
    formData.set("dailyCaloriesTarget", "2800");
    formData.set("favoriteMeals", "Protein-Porridge\nPasta");
    formData.set("likedIngredients", "Skyr, Reis");
    formData.set("dislikedIngredients", "Oliven");
    formData.set("breakfast", "Schnell und proteinreich");
    formData.set("lunch", "Meal Prep bevorzugt");
    formData.set("dinner", "Gemeinsam mit Sena");
    formData.set("softRules", "Office-Mahlzeiten transportierbar");
    formData.set("notes", "Trainingstage mitdenken");

    const input = buildProfileInputFromFormData(formData);

    expect(input).toMatchObject({
      personId: "bugra",
      displayName: "Buğra",
      primaryGoal: "muscle_gain",
      dailyCaloriesTarget: 2800,
      preferences: {
        favoriteMeals: ["Protein-Porridge", "Pasta"],
        likedIngredients: ["Skyr", "Reis"],
        dislikedIngredients: ["Oliven"],
        notes: "Trainingstage mitdenken",
      },
      mealGuidance: {
        breakfast: "Schnell und proteinreich",
        lunch: "Meal Prep bevorzugt",
        dinner: "Gemeinsam mit Sena",
      },
      softRules: ["Office-Mahlzeiten transportierbar"],
    });
    expect(validateProfileInput(input)).toEqual([]);
  });
});
