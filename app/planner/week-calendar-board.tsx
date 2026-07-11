"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import type { MealView, WeekPlanView } from "@/src/planner/week-plan-view";
import type { DayContext, WeekContext, Weekday } from "@/src/planner/repository";
import type { PersonId } from "@/src/profiles/repository";
import { normalizeHomeOfficeTargets, normalizeLunchBatchDishCount } from "@/src/week-context/model";
import { savePlannerWeekContextAction } from "./actions";

type PersonConfig = {
  personId: PersonId;
  displayName: string;
};

type CalendarDay = {
  weekday: Weekday;
  label: string;
  shortLabel: string;
  date: string | null;
};

type HomeState = Record<Weekday, Record<PersonId, boolean>>;

type Props = {
  context: WeekContext;
  weekPlan: WeekPlanView | null;
  people: PersonConfig[];
  days: CalendarDay[];
};

const mealSlots: Array<"breakfast" | "lunch" | "dinner"> = ["breakfast", "lunch", "dinner"];

const mealSlotLabels: Record<(typeof mealSlots)[number], string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
};

function buildInitialHomeState(context: WeekContext, days: CalendarDay[], people: PersonConfig[]): HomeState {
  return days.reduce<HomeState>((state, day) => {
    state[day.weekday] = people.reduce<Record<PersonId, boolean>>(
      (personState, person) => {
        const entry = context.days.find(
          (contextDay) =>
            contextDay.weekday === day.weekday && contextDay.personId === person.personId,
        );
        personState[person.personId] = entry?.dayContext === "home";
        return personState;
      },
      {} as Record<PersonId, boolean>,
    );
    return state;
  }, {} as HomeState);
}

function isWeekend(weekday: Weekday): boolean {
  return weekday === "saturday" || weekday === "sunday";
}

function getDayContext(homeState: HomeState, weekday: Weekday, personId: PersonId): DayContext {
  if (isWeekend(weekday)) {
    return "home";
  }

  return homeState[weekday]?.[personId] ? "home" : "office";
}

function getMealForSlot(day: WeekPlanView["days"][number] | undefined, slot: (typeof mealSlots)[number]) {
  return day?.meals.filter((meal) => meal.mealType === slot) ?? [];
}

export function WeekCalendarBoard({ context, weekPlan, people, days }: Props) {
  const [homeState, setHomeState] = useState(() => buildInitialHomeState(context, days, people));
  const [selectedMeal, setSelectedMeal] = useState<{ day: WeekPlanView["days"][number]; meal: MealView } | null>(null);
  const [lunchBatchDishCount, setLunchBatchDishCount] = useState(() =>
    normalizeLunchBatchDishCount(context.lunchBatchDishCount),
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isInitialCalendarState = useRef(true);
  const [, startTransition] = useTransition();
  const homeOfficeTargets = normalizeHomeOfficeTargets(context.homeOfficeTargets);
  useEffect(() => {
    if (!selectedMeal) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setSelectedMeal(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedMeal]);

  useEffect(() => {
    if (isInitialCalendarState.current) {
      isInitialCalendarState.current = false;
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const form = formRef.current;
      if (!form) {
        return;
      }

      const formData = new FormData(form);
      startTransition(() => {
        void savePlannerWeekContextAction(formData);
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [homeState, lunchBatchDishCount, startTransition]);

  function setPersonHome(weekday: Weekday, personId: PersonId, isHome: boolean): void {
    if (isWeekend(weekday)) {
      return;
    }

    setHomeState((current) => ({
      ...current,
      [weekday]: {
        ...current[weekday],
        [personId]: isHome,
      },
    }));
  }

  function adjustLunchBatchDishCount(delta: number): void {
    setLunchBatchDishCount((current) => normalizeLunchBatchDishCount(current + delta));
  }

  return (
    <form className="calendar-planner" ref={formRef}>
      <input type="hidden" name="weekStartDate" value={context.weekStartDate ?? ""} />
      <input type="hidden" name="notes" value={context.notes ?? ""} />
      <input type="hidden" name="lunchBatchDishCount" value={lunchBatchDishCount} />
      {people.map((person) => (
        <input
          key={person.personId}
          type="hidden"
          name={`homeOfficeTarget.${person.personId}`}
          value={homeOfficeTargets[person.personId]}
        />
      ))}
      {days.map((day) => {
        const contextDay = context.days.find((entry) => entry.weekday === day.weekday);

        return (
          <input
            key={day.weekday}
            type="hidden"
            name={`date.${day.weekday}`}
            value={contextDay?.date ?? day.date ?? ""}
          />
        );
      })}
      {days.flatMap((day) =>
        people.map((person) => (
          <input
            key={`${day.weekday}-${person.personId}`}
            type="hidden"
            name={`context.${day.weekday}.${person.personId}`}
            value={getDayContext(homeState, day.weekday, person.personId)}
          />
        )),
      )}

      <section className="calendar-command">
        <div>
          <h2>{weekPlan?.title ?? "Wochenplan"}</h2>
        </div>

        <div className="calendar-command-tools">
          <div className="lunch-batch-stepper" aria-label="Anzahl verschiedener Mittagsgerichte Montag bis Freitag">
            <span>Mittagsgerichte</span>
            <div>
              <button
                aria-label="Weniger Lunch-Batch-Gerichte"
                onClick={() => adjustLunchBatchDishCount(-1)}
                type="button"
              >
                -
              </button>
              <strong>{lunchBatchDishCount}</strong>
              <button
                aria-label="Mehr Lunch-Batch-Gerichte"
                onClick={() => adjustLunchBatchDishCount(1)}
                type="button"
              >
                +
              </button>
            </div>
            <small>verschiedene Gerichte Mo-Fr</small>
          </div>

        </div>
      </section>

      <div className="calendar-board" aria-label="Wochenkalender">
        {days.map((day) => {
          const planDay = weekPlan?.days.find((entry) => entry.weekday === day.weekday);

          return (
            <article className="calendar-day" key={day.weekday}>
              <header>
                <div>
                  <span>{day.shortLabel}</span>
                  <h3>{day.label}</h3>
                </div>
                <small>{planDay?.date ?? day.date ?? ""}</small>
              </header>

              <div className="home-drop-grid">
                {isWeekend(day.weekday) ? (
                  <div className="weekend-rest-panel">
                    <span>{day.shortLabel}</span>
                    <strong>Wochenende</strong>
                    <small>Kein Büro- oder Homeoffice-Setup</small>
                  </div>
                ) : people.map((person) => {
                  const isHome = homeState[day.weekday]?.[person.personId] ?? false;

                  return (
                    <button
                      aria-label={`${day.label}, ${person.displayName}: Homeoffice ${isHome ? "entfernen" : "eintragen"}`}
                      aria-pressed={isHome}
                      className={`home-office-toggle home-office-toggle-${person.personId}${isHome ? " home-office-toggle-active" : ""}`}
                      key={person.personId}
                      onClick={() => setPersonHome(day.weekday, person.personId, !isHome)}
                      type="button"
                    >
                      <span className="home-office-toggle-dot" aria-hidden="true" />
                      <span>{person.displayName}</span>
                      <strong>{isHome ? "Homeoffice" : "+"}</strong>
                    </button>
                  );
                })}
              </div>

              <div className="calendar-meals">
                {mealSlots.map((slot) => {
                  const meals = getMealForSlot(planDay, slot);

                  return (
                    <section className="calendar-meal-slot" key={slot}>
                      <span>{mealSlotLabels[slot]}</span>
                      <div>
                        {meals.length > 0 ? (
                          meals.map((meal) => (
                            <button
                              className={
                                meal.isSharedDinner
                                  ? "calendar-meal calendar-meal-shared"
                                  : meal.isPersonalMeal
                                    ? `calendar-meal calendar-meal-personal calendar-meal-${meal.people[0]?.personId}`
                                    : "calendar-meal"
                              }
                              key={meal.mealId}
                              onClick={() => {
                                if (planDay) {
                                  setSelectedMeal({ day: planDay, meal });
                                }
                              }}
                              type="button"
                            >
                              <strong>{meal.title}</strong>
                              <p>{meal.ingredientSummary}</p>
                            </button>
                          ))
                        ) : (
                          <article className="calendar-meal calendar-meal-empty">
                            <strong className="empty-meal">Leer</strong>
                          </article>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {selectedMeal ? (
        <div
          className="meal-dialog-backdrop"
          onMouseDown={() => setSelectedMeal(null)}
          role="presentation"
        >
          <section
            aria-labelledby="meal-dialog-title"
            aria-modal="true"
            className={`meal-dialog meal-dialog-${selectedMeal.meal.personTheme}`}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className="meal-dialog-header">
              <div>
                <span>{selectedMeal.day.label}{selectedMeal.day.date ? ` · ${selectedMeal.day.date}` : ""}</span>
                <h2 id="meal-dialog-title">{selectedMeal.meal.title}</h2>
              </div>
              <button
                aria-label="Gericht-Details schließen"
                className="meal-dialog-close"
                onClick={() => setSelectedMeal(null)}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="meal-dialog-meta" aria-label="Gericht-Metadaten">
              <span>{selectedMeal.meal.slotLabel}</span>
              <span>{selectedMeal.meal.contextLabel}</span>
              <span>{selectedMeal.meal.peopleSummary}</span>
            </div>

            <section className="meal-dialog-section">
              <h3>Portionen & Kalorien</h3>
              {(selectedMeal.meal.calorieFacts?.length ?? 0) > 0 ? (
                <div className="calorie-fact-grid">
                  {selectedMeal.meal.calorieFacts.map((fact) => (
                    <div className="calorie-fact-card" key={`${fact.label ?? "portion"}-${fact.kcal}-${fact.grams}`}>
                      {fact.label ? <span>{fact.label}</span> : null}
                      <div>
                        {fact.kcal ? (
                          <strong>
                            {fact.kcal}
                            <small>kcal</small>
                          </strong>
                        ) : null}
                        {fact.grams ? (
                          <strong>
                            {fact.grams}
                            <small>g</small>
                          </strong>
                        ) : null}
                      </div>
                      {fact.kcalPer100G ? <p>{fact.kcalPer100G} kcal pro 100 g</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="calorie-estimate">Keine Kalorienangabe vorhanden.</p>
              )}
              <small className="calorie-estimate-note">AI-Schätzung</small>
            </section>

            <section className="meal-dialog-section">
              <h3>Zutaten</h3>
              <ul className="meal-ingredient-list">
                {selectedMeal.meal.ingredients.map((ingredient) => (
                  <li key={`${selectedMeal.meal.mealId}-${ingredient.name}`}>
                    <div>
                      <strong>{ingredient.name}</strong>
                      {ingredient.notes ? <small>{ingredient.notes}</small> : null}
                    </div>
                    <span>
                      {ingredient.amount}
                      {ingredient.pantryItem ? " · Vorrat" : ""}
                      {ingredient.optional ? " · optional" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {selectedMeal.meal.mealPrepSummary || selectedMeal.meal.notes ? (
              <section className="meal-dialog-section">
                <h3>Hinweise</h3>
                {selectedMeal.meal.mealPrepSummary ? <p>{selectedMeal.meal.mealPrepSummary}</p> : null}
                {selectedMeal.meal.notes && selectedMeal.meal.notes !== selectedMeal.meal.mealPrepSummary ? (
                  <p>{selectedMeal.meal.notes}</p>
                ) : null}
              </section>
            ) : null}
          </section>
        </div>
      ) : null}
    </form>
  );
}
