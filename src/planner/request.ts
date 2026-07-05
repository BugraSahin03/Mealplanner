import type { WeekContext, Weekday } from "./repository";
import type { Profile } from "../profiles/repository";
import { normalizeHomeOfficeTargets, normalizeLunchBatchDishCount, weekdays } from "../week-context/model";

export type PlannerRequestDayContext = {
  personId: Profile["personId"];
  dayContext: "office" | "home";
  notes?: string;
};

export type PlannerRequestDay = {
  dayId: string;
  date?: string;
  weekday: Weekday;
  personContexts: PlannerRequestDayContext[];
};

export type PlannerRequestPerson = {
  schemaVersion: "1.0";
  personId: Profile["personId"];
  displayName: string;
  goals: {
    primaryGoal: Profile["primaryGoal"];
    dailyCaloriesTarget?: number;
    proteinFocus: boolean;
    notes: string;
  };
  preferences: Profile["preferences"];
  mealGuidance: Profile["mealGuidance"];
  hardRules: string[];
  softRules: string[];
  profileNotesMarkdown?: string;
};

export type PlannerRequest = {
  schemaVersion: "1.0";
  week: {
    weekStartDate?: string;
    calendarYear: number;
    calendarWeek: number;
    homeOfficeTargets: Record<Profile["personId"], number>;
    days: PlannerRequestDay[];
  };
  people: PlannerRequestPerson[];
  planningRules: {
    mealsPerDay: Array<"breakfast" | "lunch" | "dinner">;
    budget: {
      monthlyBudgetEur: number;
      weeklyTargetEur: number;
      notes: string;
    };
    lunchBatchPrep: {
      enabled: boolean;
      weekdayDishCount: number;
      weekdays: Array<Extract<Weekday, "monday" | "tuesday" | "wednesday" | "thursday" | "friday">>;
      notes: string;
    };
    dinnerLeftoverPlanning: {
      enabled: boolean;
      defaultDinnerSpanDays: number;
      notes: string;
    };
    shoppingMode: "weekly";
    stores: string[];
    globalNotes: string;
  };
};

function mapProfile(profile: Profile): PlannerRequestPerson {
  return {
    schemaVersion: "1.0",
    personId: profile.personId,
    displayName: profile.displayName,
    goals: {
      primaryGoal: profile.primaryGoal,
      ...(profile.dailyCaloriesTarget === null
        ? {}
        : { dailyCaloriesTarget: profile.dailyCaloriesTarget }),
      proteinFocus: profile.primaryGoal === "muscle_gain" || profile.primaryGoal === "weight_gain",
      notes: profile.preferences.notes,
    },
    preferences: profile.preferences,
    mealGuidance: profile.mealGuidance,
    hardRules: profile.hardRules,
    softRules: profile.softRules,
    ...(profile.profileNotesMarkdown ? { profileNotesMarkdown: profile.profileNotesMarkdown } : {}),
  };
}

export function buildPlannerRequestFromWeekContext(
  weekContext: WeekContext,
  profiles: Profile[],
): PlannerRequest {
  const homeOfficeTargets = normalizeHomeOfficeTargets(weekContext.homeOfficeTargets);
  const lunchBatchDishCount = normalizeLunchBatchDishCount(weekContext.lunchBatchDishCount);

  const days = weekdays.map<PlannerRequestDay>((weekday) => {
    const entries = weekContext.days.filter((day) => day.weekday === weekday.weekday);
    const first = entries[0];

    return {
      dayId: first?.dayId ?? weekday.weekday,
      ...(first?.date ? { date: first.date } : {}),
      weekday: weekday.weekday,
      personContexts: entries
        .filter((entry) => entry.dayContext === "office" || entry.dayContext === "home")
        .map((entry) => ({
          personId: entry.personId,
          dayContext: entry.dayContext as "office" | "home",
          ...(entry.notes ? { notes: entry.notes } : {}),
        })),
    };
  });

  return {
    schemaVersion: "1.0",
    week: {
      ...(weekContext.weekStartDate ? { weekStartDate: weekContext.weekStartDate } : {}),
      calendarYear: weekContext.calendarYear ?? new Date().getFullYear(),
      calendarWeek: weekContext.calendarWeek ?? 1,
      homeOfficeTargets,
      days,
    },
    people: profiles.map(mapProfile),
    planningRules: {
      mealsPerDay: ["breakfast", "lunch", "dinner"],
      budget: {
        monthlyBudgetEur: 500,
        weeklyTargetEur: 115,
        notes:
          "Budget soll nicht ausgeschoepft werden, wenn guenstigere Planung moeglich ist.",
      },
      lunchBatchPrep: {
        enabled: true,
        weekdayDishCount: lunchBatchDishCount,
        weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        notes:
          "Plane Mittagessen fuer Montag bis Freitag als Batch-Prep: begrenze die Anzahl verschiedener Lunch-Gerichte und verteile sie mit personenspezifischen Portionen.",
      },
      dinnerLeftoverPlanning: {
        enabled: true,
        defaultDinnerSpanDays: 2,
        notes:
          "Plane gemeinsame Abendessen bewusst so, dass ein Kochlauf in der Regel zwei aufeinanderfolgende Abendessen abdeckt: frisch gekocht plus Restetag.",
      },
      shoppingMode: "weekly",
      stores: ["Netto", "Lidl"],
      globalNotes:
        "Abendessen normalerweise gemeinsam planen. Office-Tage brauchen transportierbares Fruehstueck und Mittagessen.",
    },
  };
}
