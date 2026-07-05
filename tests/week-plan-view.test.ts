import { describe, expect, it } from "vitest";

import { buildWeekPlanView } from "../src/planner/week-plan-view";
import { buildDemoPlannerResponse, type PlannerResponse } from "../src/planner/response";
import { groupShoppingListItems } from "../src/shopping-list/grouping";

function buildSevenDayResponse(): PlannerResponse {
  return {
    schemaVersion: "1.0",
    plan: {
      title: "Test-Wochenplan",
      summary: "Eine komplette Woche.",
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ].map((weekday) => ({
        dayId: weekday,
        weekday: weekday as PlannerResponse["plan"]["days"][number]["weekday"],
        meals: [
          {
            mealId: `${weekday}-breakfast`,
            mealType: "breakfast",
            title: "Skyr Bowl",
            people: [{ personId: "bugra" }, { personId: "sena" }],
            context: "home",
            ingredients: [{ name: "Skyr", amount: 500, unit: "g", category: "dairy_eggs" }],
          },
          {
            mealId: `${weekday}-lunch`,
            mealType: "lunch",
            title: "Office Bowl",
            people: [{ personId: "bugra" }],
            context: "office",
            ingredients: [{ name: "Reis", amount: 150, unit: "g", category: "dry_goods" }],
          },
          {
            mealId: `${weekday}-dinner`,
            mealType: "dinner",
            title: "Gemeinsame Pasta",
            people: [{ personId: "bugra" }, { personId: "sena" }],
            context: "shared",
            ingredients: [{ name: "Pasta", amount: 300, unit: "g", category: "dry_goods" }],
          },
        ],
      })),
    },
    shoppingList: [
      {
        name: "Tomaten",
        amount: 1.5,
        unit: "kg",
        category: "produce",
        sourceMealIds: ["monday-dinner"],
        buyingHint: "Reife Tomaten kaufen.",
      },
      {
        name: "Olivenoel",
        amount: 1,
        unit: "bottle",
        category: "condiments_spices",
        pantryItem: true,
        optional: true,
        notes: "Nur bei leerem Vorrat.",
      },
    ],
    plannerNotes: ["Mittagessen fuer Office geeignet."],
  };
}

describe("week plan view", () => {
  it("renders seven days with meal slots and shared dinners", () => {
    const view = buildWeekPlanView(buildSevenDayResponse());

    expect(view.title).toBe("Test-Wochenplan");
    expect(view.days).toHaveLength(7);
    expect(view.days[0]?.label).toBe("Montag");
    expect(view.days.every((day) => day.meals.length === 3)).toBe(true);
    expect(view.days[0]?.meals.map((meal) => meal.slotLabel)).toEqual([
      "Fruehstueck",
      "Mittagessen",
      "Abendessen",
    ]);
    expect(view.days[0]?.meals[2]).toMatchObject({
      peopleSummary: "Gemeinsam",
      isSharedDinner: true,
      contextLabel: "Gemeinsam",
    });
  });

  it("groups shopping items with amounts, pantry, optional and buying hints", () => {
    const view = buildWeekPlanView(buildSevenDayResponse());

    expect(view.shoppingGroups.map((group) => group.label)).toEqual([
      "Obst & Gemuese",
      "Gewuerze & Saucen",
    ]);
    expect(view.shoppingGroups[0]?.items[0]).toMatchObject({
      name: "Tomaten",
      amount: "1,5 kg",
      buyingHint: "Reife Tomaten kaufen.",
      pantryItem: false,
      optional: false,
    });
    expect(view.shoppingGroups[1]?.items[0]).toMatchObject({
      name: "Olivenoel",
      amount: "1 Flasche",
      pantryItem: true,
      optional: true,
      notes: "Nur bei leerem Vorrat.",
    });
  });

  it("keeps shopping groups in store-friendly category order", () => {
    const groups = groupShoppingListItems([
      { name: "Pasta", amount: 500, unit: "g", category: "dry_goods" },
      { name: "Salat", amount: 1, unit: "piece", category: "produce" },
      { name: "Joghurt", amount: 500, unit: "g", category: "dairy_eggs" },
    ]);

    expect(groups.map((group) => group.category)).toEqual([
      "produce",
      "dairy_eggs",
      "dry_goods",
    ]);
  });

  it("supports separate breakfast and lunch cards per person", () => {
    const view = buildWeekPlanView(buildDemoPlannerResponse());
    const monday = view.days[0];

    expect(monday?.meals.filter((meal) => meal.mealType === "breakfast")).toHaveLength(2);
    expect(monday?.meals.filter((meal) => meal.mealType === "lunch")).toHaveLength(2);
    expect(monday?.meals.filter((meal) => meal.mealType === "dinner")).toHaveLength(1);
    expect(monday?.meals.filter((meal) => meal.isPersonalMeal).map((meal) => meal.peopleSummary)).toEqual([
      "Buğra",
      "Sena",
      "Buğra",
      "Sena",
    ]);
    expect(monday?.meals[0]?.title).toBe("Protein-Skyr");
    expect(monday?.meals[0]?.ingredientSummary).toBe("Skyr, Haferflocken, Beeren");
    expect(monday?.meals.find((meal) => meal.mealType === "dinner")).toMatchObject({
      isSharedDinner: true,
      peopleSummary: "Gemeinsam",
    });
  });

  it("summarizes lunch batch prep dishes with days, portions, grams and calories", () => {
    const view = buildWeekPlanView(buildDemoPlannerResponse());
    const mondayLunch = view.days[0]?.meals.find((meal) => meal.mealId === "monday-lunch-bugra");

    expect(view.lunchBatchDishes).toHaveLength(2);
    expect(view.lunchBatchDishes[0]).toMatchObject({
      batchId: "batch-lunch-chicken-rice",
      title: "Chicken-Reis-Bowl",
      daysSummary: "Mo, Mi, Fr",
      peopleSummary: "Buğra, Sena",
    });
    expect(view.lunchBatchDishes[0]?.portionSummary).toContain("Buğra: 3 Portion(en), 450 g, ca. 720 kcal");
    expect(view.lunchBatchDishes[0]?.portionSummary).toContain("Sena: 3 Portion(en), 320 g, ca. 510 kcal");
    expect(mondayLunch?.portionSummary).toBe("Buğra: 450 g, ca. 720 kcal");
  });
});
