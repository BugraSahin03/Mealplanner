import Link from "next/link";

import { getDb } from "@/src/db/client";
import { buildPlannerRequestFromWeekContext } from "@/src/planner/request";
import { listProfiles } from "@/src/profiles/repository";
import { getContextForDay, weekdays, weekContextPeople } from "@/src/week-context/model";
import { getOrCreateCurrentWeekContext } from "@/src/week-context/repository";
import { saveWeekContextAction } from "./actions";

export const dynamic = "force-dynamic";

const contextLabels = {
  office: "Office",
  home: "Home",
};

function formatIsoDate(date: string | null | undefined): string {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T00:00:00`));
}

export default function WeekPage() {
  const db = getDb();
  const context = getOrCreateCurrentWeekContext(db);
  const profiles = listProfiles(db);
  const plannerRequest = buildPlannerRequestFromWeekContext(context, profiles);
  const officeSlots = context.days.filter((day) => day.dayContext === "office").length;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Bereiche">
        <Link className="brand brand-link" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Essenplanner</span>
        </Link>

        <nav className="nav-list" aria-label="Hauptnavigation">
          <Link className="nav-link" href="/profile">
            Profile
          </Link>
          <Link className="nav-link nav-link-active" href="/week">
            Woche
          </Link>
          <Link className="nav-link" href="/#plan">
            Wochenplan
          </Link>
          <Link className="nav-link" href="/#einkauf">
            Einkaufsliste
          </Link>
        </nav>
      </aside>

      <div className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Wochen-Setup</p>
            <h1>Office und Home fuer die naechste Planung.</h1>
          </div>
          <div className="status-pill">
            <span>{officeSlots}</span>
            <small>Office-Slots</small>
          </div>
        </header>

        <form className="week-form" action={saveWeekContextAction}>
          <input type="hidden" name="weekStartDate" value={context.weekStartDate ?? ""} />
          {weekdays.map((day) => {
            const firstEntry = context.days.find((entry) => entry.weekday === day.weekday);

            return (
              <section className="week-day-row" key={day.weekday}>
                <input type="hidden" name={`date.${day.weekday}`} value={firstEntry?.date ?? ""} />

                <div className="week-day-heading">
                  <p className="eyebrow">{day.shortLabel}</p>
                  <h2>{day.label}</h2>
                  <span>{formatIsoDate(firstEntry?.date)}</span>
                </div>

                <div className="person-context-grid">
                  {weekContextPeople.map((person) => {
                    const selected = getContextForDay(context, day.weekday, person.personId);

                    return (
                      <fieldset className="context-fieldset" key={person.personId}>
                        <legend>{person.displayName}</legend>
                        <div className="segmented-control">
                          {(["office", "home"] as const).map((choice) => (
                            <label key={choice}>
                              <input
                                type="radio"
                                name={`context.${day.weekday}.${person.personId}`}
                                value={choice}
                                defaultChecked={selected === choice}
                              />
                              <span>{contextLabels[choice]}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <label>
            Wochenhinweise
            <textarea name="notes" defaultValue={context.notes ?? ""} rows={3} />
          </label>

          <div className="form-footer">
            <div>
              <p className="eyebrow">Planner-Request</p>
              <p className="muted">
                {plannerRequest.week.days.length} Tage und {plannerRequest.people.length} Profile
                bereit.
              </p>
            </div>
            <button className="primary-button" type="submit">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
