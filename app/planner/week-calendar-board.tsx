"use client";

import { useMemo, useState } from "react";

import type { WeekPlanView } from "@/src/planner/week-plan-view";
import type { DayContext, WeekContext, Weekday } from "@/src/planner/repository";
import type { PersonId } from "@/src/profiles/repository";
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

function getDayContext(homeState: HomeState, weekday: Weekday, personId: PersonId): DayContext {
  return homeState[weekday]?.[personId] ? "home" : "office";
}

function getMealForSlot(day: WeekPlanView["days"][number] | undefined, slot: (typeof mealSlots)[number]) {
  return day?.meals.find((meal) => meal.mealType === slot) ?? null;
}

export function WeekCalendarBoard({ context, weekPlan, people, days }: Props) {
  const [homeState, setHomeState] = useState(() => buildInitialHomeState(context, days, people));
  const [draggedPerson, setDraggedPerson] = useState<PersonId | null>(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null);
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
    setHomeState((current) => ({
      ...current,
      [weekday]: {
        ...current[weekday],
        [personId]: isHome,
      },
    }));
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
          value={targetCounts[person.personId] ?? 0}
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
              onDragEnd={() => {
                setDraggedPerson(null);
                setHoveredDropZone(null);
              }}
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
                {people.map((person) => {
                  const isHome = homeState[day.weekday]?.[person.personId] ?? false;
                  const dropZoneId = `${day.weekday}-${person.personId}`;
                  const isDropReady = draggedPerson === person.personId;
                  const isDropHovered = hoveredDropZone === dropZoneId;

                  return (
                    <button
                      className={
                        isHome
                          ? `home-drop-zone home-drop-zone-active home-drop-zone-${person.personId}${isDropReady ? " home-drop-zone-ready" : ""}${isDropHovered ? " home-drop-zone-hover" : ""}`
                          : `home-drop-zone${isDropReady ? " home-drop-zone-ready" : ""}${isDropHovered ? " home-drop-zone-hover" : ""}`
                      }
                      key={person.personId}
                      onClick={() => setPersonHome(day.weekday, person.personId, !isHome)}
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
                      onDrop={(event) => {
                        event.preventDefault();
                        const droppedPerson = event.dataTransfer.getData("text/plain") as PersonId;
                        if (droppedPerson === person.personId) {
                          setPersonHome(day.weekday, person.personId, true);
                        }
                        setDraggedPerson(null);
                        setHoveredDropZone(null);
                      }}
                      type="button"
                    >
                      <span>{person.displayName}</span>
                      <strong>{isHome ? "Homeoffice" : "Büro"}</strong>
                      <small>{isHome ? "gesetzt" : "hier ablegen"}</small>
                    </button>
                  );
                })}
              </div>

              <div className="calendar-meals">
                {mealSlots.map((slot) => {
                  const meal = getMealForSlot(planDay, slot);

                  return (
                    <section className={meal?.isSharedDinner ? "calendar-meal calendar-meal-shared" : "calendar-meal"} key={slot}>
                      <span>{mealSlotLabels[slot]}</span>
                      {meal ? (
                        <>
                          <strong>{meal.title}</strong>
                          <div>
                            <em>{meal.contextLabel}</em>
                            <em>{meal.peopleSummary}</em>
                          </div>
                          <p>{meal.ingredientSummary}</p>
                        </>
                      ) : (
                        <strong className="empty-meal">Leer</strong>
                      )}
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
