import Link from "next/link";

import { getDb } from "@/src/db/client";
import { getLatestPlannerJob, listPlannerJobs, type PlannerJob } from "@/src/planner/repository";
import { buildWeekPlanView } from "@/src/planner/week-plan-view";
import { weekdays, weekContextPeople } from "@/src/week-context/model";
import { getOrCreateCurrentWeekContext } from "@/src/week-context/repository";
import {
  completePlannerJobAction,
  createPlannerJobAction,
  failPlannerJobAction,
  startPlannerJobAction,
} from "./actions";
import { ShoppingList } from "./shopping-list";
import { WeekCalendarBoard } from "./week-calendar-board";

export const dynamic = "force-dynamic";

const statusLabels: Record<PlannerJob["status"], string> = {
  idle: "Bereit",
  running: "Laeuft",
  success: "Fertig",
  failed: "Fehler",
};

const statusDescriptions: Record<PlannerJob["status"], string> = {
  idle: "Der Auftrag ist angelegt und wartet auf den Planner.",
  running: "Die Wochenplanung wird verarbeitet.",
  success: "Der Planner-Response wurde validiert und gespeichert.",
  failed: "Der Auftrag ist fehlgeschlagen. Fehlerdetails sind gespeichert.",
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Noch nicht gesetzt";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(`${value.replace(" ", "T")}Z`));
}

function readResponseTitle(job: PlannerJob | null): string {
  const response = job?.response;
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return "Noch kein validierter Plan gespeichert.";
  }

  const plan = (response as { plan?: unknown }).plan;
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return "Noch kein validierter Plan gespeichert.";
  }

  return (plan as { title?: string }).title ?? "Validierter Plan gespeichert.";
}

export default function PlannerPage() {
  const db = getDb();
  const weekContext = getOrCreateCurrentWeekContext(db);
  const latestJob = getLatestPlannerJob(db);
  const jobs = listPlannerJobs(db, 5);
  const latestStatus = latestJob?.status ?? "idle";
  const weekPlan = latestJob?.status === "success" && latestJob.response
    ? buildWeekPlanView(latestJob.response)
    : null;

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
          <Link className="nav-link nav-link-active" href="/planner">
            Wochenplan
          </Link>
          <Link className="nav-link" href="/planner#einkauf">
            Einkaufsliste
          </Link>
        </nav>
      </aside>

      <div className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Planner-Job</p>
            <h1>Wochenplanung als Auftrag.</h1>
          </div>
          <div className={`status-pill job-status-pill job-status-${latestStatus}`}>
            <span>{statusLabels[latestStatus]}</span>
            <small>Status</small>
          </div>
        </header>

        <section className="section-block">
          <div className="section-heading">
            <p className="eyebrow">Aktueller Auftrag</p>
            <h2>{latestJob ? statusDescriptions[latestJob.status] : "Noch kein Auftrag angelegt."}</h2>
          </div>

          <div className="job-detail-grid">
            <div>
              <span>Job-ID</span>
              <strong>{latestJob?.jobId ?? "Noch offen"}</strong>
            </div>
            <div>
              <span>Woche</span>
              <strong>{latestJob?.weekId ?? "Aktuelle Woche wird beim Anlegen genutzt"}</strong>
            </div>
            <div>
              <span>Aktualisiert</span>
              <strong>{formatTimestamp(latestJob?.updatedAt ?? null)}</strong>
            </div>
            <div>
              <span>Ergebnis</span>
              <strong>{readResponseTitle(latestJob)}</strong>
            </div>
          </div>

          {latestJob?.status === "failed" ? (
            <div className="job-error" role="status">
              <strong>{latestJob.errorCode ?? "planner_failed"}</strong>
              <p>{latestJob.errorMessage}</p>
            </div>
          ) : null}

          <div className="job-actions" aria-label="Planner-Job Aktionen">
            <form action={createPlannerJobAction}>
              <button className="primary-button" type="submit">
                Job anlegen
              </button>
            </form>
            <form action={startPlannerJobAction}>
              <button
                className="secondary-button"
                type="submit"
                disabled={!latestJob || latestJob.status === "running" || latestJob.status === "success"}
              >
                Lauf starten
              </button>
            </form>
            <form action={completePlannerJobAction}>
              <button
                className="secondary-button"
                type="submit"
                disabled={!latestJob || latestJob.status !== "running"}
              >
                Erfolg simulieren
              </button>
            </form>
            <form action={failPlannerJobAction}>
              <button
                className="secondary-button"
                type="submit"
                disabled={!latestJob || latestJob.status !== "running"}
              >
                Fehler simulieren
              </button>
            </form>
          </div>
        </section>

        <section className="section-block plan-board-section" id="plan">
          <WeekCalendarBoard
            context={weekContext}
            days={weekdays.map((day) => ({
              ...day,
              date: weekContext.days.find((entry) => entry.weekday === day.weekday)?.date ?? null,
            }))}
            people={weekContextPeople}
            weekPlan={weekPlan}
          />
        </section>

        {weekPlan ? (
          <>
            <section className="section-block shopping-list-section" id="einkauf">
              <div className="section-heading">
                <p className="eyebrow">Einkaufsliste</p>
                <h2>Gruppiert fuer den Wocheneinkauf</h2>
              </div>

              <ShoppingList groups={weekPlan.shoppingGroups} />
            </section>
          </>
        ) : (
          <section className="section-block plan-empty-state" id="einkauf">
            <div className="section-heading">
              <p className="eyebrow">Einkaufsliste</p>
              <h2>Noch keine Einkaufsliste gespeichert.</h2>
            </div>
            <p className="section-copy">
              Sobald ein Planner-Lauf erfolgreich ist, wird die Einkaufsliste hier automatisch aus dem Wochenplan gebildet.
            </p>
          </section>
        )}

        <section className="section-block">
          <div className="section-heading">
            <p className="eyebrow">Letzte Jobs</p>
            <h2>Statusverlauf</h2>
          </div>

          <div className="job-list">
            {jobs.length === 0 ? (
              <p className="muted">Noch keine Planner-Jobs vorhanden.</p>
            ) : (
              jobs.map((job) => (
                <article className="job-row" key={job.jobId}>
                  <div>
                    <span>{statusLabels[job.status]}</span>
                    <strong>{job.jobId}</strong>
                  </div>
                  <p>{formatTimestamp(job.updatedAt)}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
