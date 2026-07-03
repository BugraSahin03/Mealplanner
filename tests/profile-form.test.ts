import { describe, expect, it } from "vitest";

import {
  buildProfileInputFromFormData,
  mergeProfileFormInput,
  textToList,
} from "../src/profiles/form";
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

  it("preserves profile fields that are not visible in the form", () => {
    const formData = new FormData();
    formData.set("personId", "sena");
    formData.set("displayName", "Sena");
    formData.set("primaryGoal", "weight_loss");
    formData.set("favoriteMeals", "Linsensuppe");
    formData.set("breakfast", "Joghurt-Bowl");

    const merged = mergeProfileFormInput(
      {
        personId: "sena",
        displayName: "Sena",
        primaryGoal: "weight_loss",
        dailyCaloriesTarget: 1700,
        preferences: {
          favoriteMeals: ["Alt"],
          likedIngredients: ["Skyr"],
          dislikedIngredients: ["Oliven"],
          likedCuisines: ["Tuerkisch"],
          dislikedCuisines: ["Sehr scharf"],
          notes: "bestehende Notiz",
        },
        mealGuidance: {
          breakfast: "Alt",
          lunch: "Alt",
          dinner: "Alt",
          officeDay: "Mitnehmbar",
          homeOfficeDay: "Frisch kochen",
          mealPrep: "Sonntag vorbereiten",
        },
        hardRules: ["Keine automatische Profilmemory-Aenderung"],
        softRules: ["kalorienbewusst"],
        profileNotesMarkdown: "# Sena\n\nBestehende Memory",
      },
      buildProfileInputFromFormData(formData),
    );

    expect(merged.preferences.favoriteMeals).toEqual(["Linsensuppe"]);
    expect(merged.preferences.likedCuisines).toEqual(["Tuerkisch"]);
    expect(merged.preferences.dislikedCuisines).toEqual(["Sehr scharf"]);
    expect(merged.mealGuidance.breakfast).toBe("Joghurt-Bowl");
    expect(merged.mealGuidance.officeDay).toBe("Mitnehmbar");
    expect(merged.mealGuidance.homeOfficeDay).toBe("Frisch kochen");
    expect(merged.mealGuidance.mealPrep).toBe("Sonntag vorbereiten");
    expect(merged.hardRules).toEqual(["Keine automatische Profilmemory-Aenderung"]);
    expect(merged.profileNotesMarkdown).toBe("# Sena\n\nBestehende Memory");
  });
});
