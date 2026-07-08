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
} from "@/src/planner/job-status-view";
import {
  buildHomeOfficeTargetSummary,
  normalizeLunchBatchDishCount,
} from "@/src/week-context/model";
import { getOrCreateCurrentWeekContext, getOrCreateWeekContextById } from "@/src/week-context/repository";
import { buildWeekHref, getWeekDateRange, getWeekLabel, resolveWeekIdFromParam } from "@/src/week-context/weeks";
import { WeekSwitcher } from "../week-switcher";
import { createAndRunPlannerJobForWeekAction } from "./actions";

export const dynamic = "force-dynamic";

type PlanPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const db = getDb();
  const selectedWeekId = resolveWeekIdFromParam(params?.week);
  const context = selectedWeekId
    ? getOrCreateWeekContextById(db, selectedWeekId)
    : getOrCreateCurrentWeekContext(db);
  const latestJob = getLatestPlannerJobForWeek(db, context.weekId);
  const latestSuccessfulJob = getLatestSuccessfulPlannerJobForWeek(db, context.weekId);
  const jobs = listPlannerJobsForWeek(db, context.weekId, 4);
  const targetSummary = buildHomeOfficeTargetSummary(context);
  const lunchBatchDishCount = normalizeLunchBatchDishCount(context.lunchBatchDishCount);
  const latestStatus = latestJob?.status ?? "idle";
  const hasExistingPlan = latestSuccessfulJob !== null;
  const canStartJob = latestJob?.status !== "running";

  return (
    <main className="app-shell command-app-shell">
      <aside className="sidebar command-sidebar" aria-label="Bereiche">
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
          <Link className="nav-link nav-link-active" href={buildWeekHref("/plan", context.weekId)}>
            Plan erstellen
          </Link>
          <Link className="nav-link" href={buildWeekHref("/planner", context.weekId)}>
            Wochenplan
          </Link>
          <Link className="nav-link" href={buildWeekHref("/shopping-list", context.weekId)}>
            Einkaufsliste
          </Link>
        </nav>
      </aside>

      <div className="content command-content">
        <header className="command-page-header">
          <div>
            <p className="eyebrow">Planungsauftrag · KW {context.calendarWeek}</p>
            <h1>Plan fuer diese Woche bewusst starten.</h1>
            <p className="section-copy">
              Auftrag fuer {getWeekLabel(context, { withYear: true })}. Diese Woche steuert Plan, Job und Einkauf.
            </p>
          </div>
          <div className={`status-pill job-status-pill job-status-${latestStatus}`}>
            <span>{plannerJobStatusLabels[latestStatus]}</span>
            <small>Status</small>
          </div>
        </header>

        <WeekSwitcher basePath="/plan" context={context} />

        <section className="plan-command-grid">
          <article className="plan-command-primary">
            <p className="eyebrow">Naechster Schritt</p>
            <h2>{hasExistingPlan ? "Plan neu erstellen?" : "Plan erstellen"}</h2>
            <p>
              {hasExistingPlan
                ? "Fuer diese KW existiert bereits ein Plan. Ein neuer Lauf wird bewusst gestartet und ersetzt nichts heimlich."
                : "Starte den Planner fuer genau diese Kalenderwoche, sobald Setup und Parameter stimmen."}
            </p>
            <form action={createAndRunPlannerJobForWeekAction}>
              <input type="hidden" name="weekId" value={context.weekId} />
              <button className="primary-button command-primary-button" disabled={!canStartJob} type="submit">
                {hasExistingPlan ? "Plan neu erstellen" : "Plan erstellen"}
              </button>
            </form>
            <Link className="command-subtle-link" href={buildWeekHref("/week", context.weekId)}>
              In die aktuelle Woche springen
            </Link>
          </article>

          <article className="plan-command-week">
            <span>Ausgewaehlte Woche</span>
            <strong>KW {context.calendarWeek}</strong>
            <p>{getWeekDateRange(context, { withYear: true })}</p>
          </article>
        </section>

        <section className="section-block command-section-block">
          <div className="section-heading">
            <p className="eyebrow">Planungsparameter</p>
            <h2>Was in den Auftrag geht</h2>
          </div>

          <div className="plan-parameter-grid">
            {targetSummary.map((target) => (
              <article key={target.personId}>
                <span>{target.displayName}</span>
                <strong>{target.actual} Homeoffice-Tage</strong>
              </article>
            ))}
            <article>
              <span>Mittagsgerichte</span>
              <strong>{lunchBatchDishCount}</strong>
            </article>
          </div>
        </section>

        <section className="section-block command-section-block">
          <div className="section-heading">
            <p className="eyebrow">Planner-/OpenClaw-Status</p>
            <h2>{plannerJobStatusDescriptions[latestStatus]}</h2>
          </div>

          <div className="job-detail-grid">
            <div>
              <span>Aktueller Job</span>
              <strong>{latestJob?.jobId ?? "Noch offen"}</strong>
            </div>
            <div>
              <span>Ausfuehrung</span>
              <strong>{readConfiguredPlannerAdapter()}</strong>
            </div>
            <div>
              <span>Aktualisiert</span>
              <strong>{formatPlannerTimestamp(latestJob?.updatedAt ?? null)}</strong>
            </div>
            <div>
              <span>Letzter fertiger Plan</span>
              <strong>{formatPlannerTimestamp(latestSuccessfulJob?.completedAt ?? null)}</strong>
            </div>
          </div>

          {latestJob?.status === "failed" ? (
            <div className="job-error" role="status">
              <strong>{latestJob.errorCode ?? "planner_failed"}</strong>
              <p>{latestJob.errorMessage}</p>
            </div>
          ) : null}

          <div className="job-list">
            {jobs.length === 0 ? (
              <p className="muted">Noch keine Planner-Jobs fuer diese KW vorhanden.</p>
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

        <section className="plan-flow-links" aria-label="Planungsfluss">
          <Link href={buildWeekHref("/week", context.weekId)}>1 · Woche vorbereiten</Link>
          <Link aria-current="page" href={buildWeekHref("/plan", context.weekId)}>2 · Plan erstellen</Link>
          <Link href={buildWeekHref("/planner", context.weekId)}>3 · Wochenplan ansehen</Link>
          <Link href={buildWeekHref("/shopping-list", context.weekId)}>4 · Einkauf nutzen</Link>
        </section>
      </div>
    </main>
  );
}
