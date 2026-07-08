import Link from "next/link";

import { getDb } from "@/src/db/client";
import {
  getLatestPlannerJobForWeek,
  getLatestSuccessfulPlannerJobForWeek,
  listPlannerJobsForWeek,
} from "@/src/planner/repository";
import {
  formatPlannerTimestamp,
  plannerJobStatusDescriptions,
  plannerJobStatusLabels,
  readConfiguredPlannerAdapter,
  readPlannerResponseTitle,
} from "@/src/planner/job-status-view";
import { buildWeekPlanView } from "@/src/planner/week-plan-view";
import { weekdays, weekContextPeople } from "@/src/week-context/model";
import { getOrCreateCurrentWeekContext, getOrCreateWeekContextById } from "@/src/week-context/repository";
import { buildWeekHref, getWeekLabel, resolveWeekIdFromParam } from "@/src/week-context/weeks";
import { WeekSwitcher } from "../week-switcher";
import { ShoppingList } from "./shopping-list";
import { WeekCalendarBoard } from "./week-calendar-board";

export const dynamic = "force-dynamic";

type PlannerPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const params = await searchParams;
  const db = getDb();
  const selectedWeekId = resolveWeekIdFromParam(params?.week);
  const weekContext = selectedWeekId
    ? getOrCreateWeekContextById(db, selectedWeekId)
    : getOrCreateCurrentWeekContext(db);
  const latestJob = getLatestPlannerJobForWeek(db, weekContext.weekId);
  const latestSuccessfulJob = getLatestSuccessfulPlannerJobForWeek(db, weekContext.weekId);
  const jobs = listPlannerJobsForWeek(db, weekContext.weekId, 5);
  const latestStatus = latestJob?.status ?? "idle";
  const weekPlan = latestSuccessfulJob?.response
    ? buildWeekPlanView(latestSuccessfulJob.response)
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
          <Link className="nav-link" href="/weeks">
            Wochen
          </Link>
          <Link className="nav-link" href={buildWeekHref("/plan", weekContext.weekId)}>
            Plan erstellen
          </Link>
          <Link className="nav-link nav-link-active" href={`/planner?week=${weekContext.weekId}`}>
            Wochenplan
          </Link>
          <Link className="nav-link" href={buildWeekHref("/shopping-list", weekContext.weekId)}>
            Einkaufsliste
          </Link>
        </nav>
      </aside>

      <div className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Wochenplan · KW {weekContext.calendarWeek}</p>
            <h1>Wochenplan ansehen.</h1>
            <p className="section-copy">Du siehst gerade {getWeekLabel(weekContext, { withYear: true })}.</p>
          </div>
          <div className={`status-pill job-status-pill job-status-${latestStatus}`}>
            <span>{plannerJobStatusLabels[latestStatus]}</span>
            <small>Status</small>
          </div>
        </header>

        <WeekSwitcher basePath="/planner" context={weekContext} />

        <section className="section-block">
          <div className="section-heading">
            <p className="eyebrow">Aktueller Auftrag</p>
            <h2>{plannerJobStatusDescriptions[latestStatus]}</h2>
          </div>

          <div className="job-detail-grid">
            <div>
              <span>Job-ID</span>
              <strong>{latestJob?.jobId ?? "Noch offen"}</strong>
            </div>
            <div>
              <span>Woche</span>
              <strong>{getWeekLabel(weekContext, { withYear: true })}</strong>
            </div>
            <div>
              <span>Aktualisiert</span>
              <strong>{formatPlannerTimestamp(latestJob?.updatedAt ?? null)}</strong>
            </div>
            <div>
              <span>Ergebnis</span>
              <strong>{readPlannerResponseTitle(latestSuccessfulJob)}</strong>
            </div>
            <div>
              <span>Ausfuehrung</span>
              <strong>{readConfiguredPlannerAdapter()}</strong>
            </div>
          </div>

          {latestJob?.status === "failed" ? (
            <div className="job-error" role="status">
              <strong>{latestJob.errorCode ?? "planner_failed"}</strong>
              <p>{latestJob.errorMessage}</p>
            </div>
          ) : null}

          <Link className="primary-button" href={buildWeekHref("/plan", weekContext.weekId)}>
            Planungsauftrag oeffnen
          </Link>
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
                <h2>Gruppiert für den Wocheneinkauf</h2>
              </div>

              <ShoppingList groups={weekPlan.shoppingGroups} />
              <Link className="secondary-button" href={buildWeekHref("/shopping-list", weekContext.weekId)}>
                Einkaufsliste als Seite oeffnen
              </Link>
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
                    <span>{plannerJobStatusLabels[job.status]}</span>
                    <strong>{job.jobId}</strong>
                  </div>
                  <p>{formatPlannerTimestamp(job.updatedAt)}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
