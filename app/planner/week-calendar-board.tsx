"use client";

import { useEffect, useMemo, useState } from "react";

import type { MealView, WeekPlanView } from "@/src/planner/week-plan-view";
import type { DayContext, WeekContext, Weekday } from "@/src/planner/repository";
import type { PersonId } from "@/src/profiles/repository";
import { normalizeHomeOfficeTargets } from "@/src/week-context/model";
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

function countHomeWeekdays(homeState: HomeState, personId: PersonId): number {
  return Object.entries(homeState).filter(([weekday, people]) => {
    return weekday !== "saturday" && weekday !== "sunday" && people[personId];
  }).length;
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
  const [draggedPerson, setDraggedPerson] = useState<PersonId | null>(null);
  const [draggedRemoval, setDraggedRemoval] = useState<{ weekday: Weekday; personId: PersonId } | null>(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null);
  const [isTrashHovered, setIsTrashHovered] = useState(false);
  const homeOfficeTargets = normalizeHomeOfficeTargets(context.homeOfficeTargets);
  const targetCounts = useMemo(
    () =>
      people.reduce<Record<PersonId, number>>(
        (counts, person) => {
          counts[person.personId] = countHomeWeekdays(homeState, person.personId);
          return counts;
        },
        {} as Record<PersonId, number>,
      ),
    [homeState, people],
  );

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

  function resetDragState(): void {
    setDraggedPerson(null);
    setDraggedRemoval(null);
    setHoveredDropZone(null);
    setIsTrashHovered(false);
  }

  function removeHomeOfficeFromPayload(payload: string): void {
    const [, weekday, personId] = payload.split(":") as [string, Weekday, PersonId];
    if (weekday && personId) {
      setPersonHome(weekday, personId, false);
    }
  }

  return (
    <form className="calendar-planner" action={savePlannerWeekContextAction}>
      <input type="hidden" name="weekStartDate" value={context.weekStartDate ?? ""} />
      <input type="hidden" name="notes" value={context.notes ?? ""} />
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
          <p className="eyebrow">Kalenderwoche {context.calendarWeek}</p>
          <h2>{weekPlan?.title ?? "Wochenplan"}</h2>
          <p className="section-copy">
            {weekPlan?.summary ?? "Mahlzeiten erscheinen hier, sobald ein Planner-Lauf abgeschlossen ist."}
          </p>
        </div>

        <div className="profile-token-tray" aria-label="Homeoffice Profile">
          {people.map((person) => (
            <button
              className={`profile-token profile-token-${person.personId}`}
              draggable
              key={person.personId}
              onDragEnd={resetDragState}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData("text/plain", person.personId);
                setDraggedPerson(person.personId);
              }}
              type="button"
            >
              <span aria-hidden="true" />
              <strong>{person.displayName}</strong>
              <small>ziehen</small>
            </button>
          ))}
          <div
            aria-label="Homeoffice entfernen"
            className={isTrashHovered ? "home-trash-zone home-trash-zone-hover" : "home-trash-zone"}
            onDragEnter={(event) => {
              if (draggedRemoval) {
                event.preventDefault();
                setIsTrashHovered(true);
              }
            }}
            onDragLeave={() => setIsTrashHovered(false)}
            onDragOver={(event) => {
              if (draggedRemoval) {
                event.preventDefault();
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              const payload = event.dataTransfer.getData("text/plain");
              if (payload.startsWith("remove:")) {
                removeHomeOfficeFromPayload(payload);
              }
              resetDragState();
            }}
            role="button"
            tabIndex={0}
          >
            <span className="trash-icon" aria-hidden="true" />
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
                  const dropZoneId = `${day.weekday}-${person.personId}`;
                  const isDropReady = draggedPerson === person.personId;
                  const isDropHovered = hoveredDropZone === dropZoneId;

                  return (
                    <div
                      className={
                        isHome
                          ? `home-drop-zone home-drop-zone-active home-drop-zone-${person.personId}${isDropReady ? " home-drop-zone-ready" : ""}${isDropHovered ? " home-drop-zone-hover" : ""}`
                          : `home-drop-zone${isDropReady ? " home-drop-zone-ready" : ""}${isDropHovered ? " home-drop-zone-hover" : ""}`
                      }
                      draggable={isHome}
                      key={person.personId}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        if (isDropReady) {
                          setHoveredDropZone(dropZoneId);
                        }
                      }}
                      onDragLeave={() => {
                        if (hoveredDropZone === dropZoneId) {
                          setHoveredDropZone(null);
                        }
                      }}
                      onDragOver={(event) => {
                        if (isDropReady) {
                          event.preventDefault();
                        }
                      }}
                      onDragEnd={resetDragState}
                      onDragStart={(event) => {
                        if (!isHome) {
                          return;
                        }
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", `remove:${day.weekday}:${person.personId}`);
                        setDraggedRemoval({ weekday: day.weekday, personId: person.personId });
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const droppedPerson = event.dataTransfer.getData("text/plain") as PersonId;
                        if (droppedPerson === person.personId) {
                          setPersonHome(day.weekday, person.personId, true);
                        }
                        resetDragState();
                      }}
                    >
                      <button
                        className="home-drop-zone-control"
                        onClick={() => setPersonHome(day.weekday, person.personId, !isHome)}
                        type="button"
                      >
                        <span>{person.displayName}</span>
                        <strong>{isHome ? "Homeoffice" : "Büro"}</strong>
                        <small>{isHome ? "gesetzt" : "hier ablegen"}</small>
                      </button>
                      {isHome ? (
                        <button
                          aria-label={`${person.displayName} Homeoffice entfernen`}
                          className="home-remove-button"
                          onClick={() => setPersonHome(day.weekday, person.personId, false)}
                          type="button"
                        >
                          <span className="trash-icon" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
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
                                    ? "calendar-meal calendar-meal-personal"
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
                              <div>
                                <em>{meal.contextLabel}</em>
                                <em>{meal.peopleSummary}</em>
                              </div>
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

      {weekPlan && (weekPlan.plannerNotes.length > 0 || weekPlan.warnings.length > 0) ? (
        <div className="plan-notes-grid">
          {weekPlan.plannerNotes.length > 0 ? (
            <div>
              <span>Planer-Notizen</span>
              {weekPlan.plannerNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          ) : null}
          {weekPlan.warnings.length > 0 ? (
            <div>
              <span>Hinweise</span>
              {weekPlan.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="calendar-footer">
        <div>
          {people.map((person) => (
            <span className={`home-count home-count-${person.personId}`} key={person.personId}>
              {person.displayName}: {targetCounts[person.personId] ?? 0} Homeoffice-Tage
            </span>
          ))}
        </div>
        <button className="primary-button" type="submit">
          Kalender speichern
        </button>
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
