"use client";

import { useMemo, useState } from "react";

import type { WeekPlanView } from "@/src/planner/week-plan-view";
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
  breakfast: "Fruehstueck",
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
  const [draggedPerson, setDraggedPerson] = useState<PersonId | null>(null);
  const [draggedRemoval, setDraggedRemoval] = useState<{ weekday: Weekday; personId: PersonId } | null>(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null);
  const [isTrashHovered, setIsTrashHovered] = useState(false);
  const [lunchBatchDishCount, setLunchBatchDishCount] = useState(() =>
    normalizeLunchBatchDishCount(context.lunchBatchDishCount),
  );
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

  function adjustLunchBatchDishCount(delta: number): void {
    setLunchBatchDishCount((current) => normalizeLunchBatchDishCount(current + delta));
  }

  return (
    <form className="calendar-planner" action={savePlannerWeekContextAction}>
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
          <p className="eyebrow">Kalenderwoche {context.calendarWeek}</p>
          <h2>{weekPlan?.title ?? "Wochenplan"}</h2>
          <p className="section-copy">
            {weekPlan?.summary ?? "Mahlzeiten erscheinen hier, sobald ein Planner-Lauf abgeschlossen ist."}
          </p>
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
        </div>
      </section>

      {weekPlan && weekPlan.lunchBatchDishes.length > 0 ? (
        <section className="lunch-batch-summary" aria-label="Lunch-Batch-Prep">
          {weekPlan.lunchBatchDishes.map((batch) => (
            <article key={batch.batchId}>
              <div>
                <span>{batch.daysSummary}</span>
                <strong>{batch.title}</strong>
              </div>
              <p>{batch.portionSummary}</p>
              {batch.notes ? <small>{batch.notes}</small> : null}
            </article>
          ))}
        </section>
      ) : null}

      {weekPlan && weekPlan.dinnerLeftoverGroups.length > 0 ? (
        <section className="dinner-leftover-summary" aria-label="Dinner-Resteplanung">
          {weekPlan.dinnerLeftoverGroups.map((group) => (
            <article key={group.leftoverGroupId}>
              <div>
                <span>{group.daysSummary}</span>
                <strong>{group.title}</strong>
              </div>
              <p>{group.spanDays} Abendessen aus einem Kochlauf</p>
              {group.notes ? <small>{group.notes}</small> : null}
            </article>
          ))}
        </section>
      ) : null}

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
                            <article
                              className={
                                meal.isSharedDinner
                                  ? "calendar-meal calendar-meal-shared"
                                  : meal.isPersonalMeal
                                    ? `calendar-meal calendar-meal-personal calendar-meal-${meal.people[0]?.personId}`
                                    : "calendar-meal"
                              }
                              key={meal.mealId}
                            >
                              <strong>{meal.title}</strong>
                              <p>{meal.ingredientSummary}</p>
                            </article>
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
    </form>
  );
}
