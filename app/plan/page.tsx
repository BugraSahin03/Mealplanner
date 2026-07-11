import Link from "next/link";

import { getDb } from "@/src/db/client";
import {
  getLatestPlannerJobForWeek,
  getLatestSuccessfulPlannerJobForWeek,
} from "@/src/planner/repository";
import {
  buildHomeOfficeTargetSummary,
  normalizeLunchBatchDishCount,
} from "@/src/week-context/model";
import { getOrCreateCurrentWeekContext, getOrCreateWeekContextById } from "@/src/week-context/repository";
import { buildWeekHref, getWeekDateRange, resolveWeekIdFromParam } from "@/src/week-context/weeks";
import { WeekSwitcher } from "../week-switcher";
import { AppBottomNav } from "../app-bottom-nav";
import { PlannerStatusPanel } from "./planner-status-panel";
import { presentPlannerError, type PlannerStatusSnapshot } from "./status";

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
  const targetSummary = buildHomeOfficeTargetSummary(context);
  const lunchBatchDishCount = normalizeLunchBatchDishCount(context.lunchBatchDishCount);
  const initialStatus: PlannerStatusSnapshot = {
    jobId: latestJob?.jobId ?? null,
    status: latestJob?.status ?? "idle",
    errorMessage: presentPlannerError(latestJob),
    updatedAt: latestJob?.updatedAt ?? null,
    hasPlan: latestSuccessfulJob !== null,
  };

  return (
    <main className="command-app-shell bottom-nav-page">
      <div className="content command-content">
        <Link className="brand brand-link command-page-brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Essenplanner</span>
        </Link>
        <header className="command-page-header">
          <div>
            <p className="eyebrow">KW {context.calendarWeek}</p>
            <h1>Plan erstellen.</h1>
          </div>
        </header>

        <WeekSwitcher basePath="/plan" context={context} />

        <section className="plan-command-grid">
          <PlannerStatusPanel
            initialStatus={initialStatus}
            plannerHref={buildWeekHref("/planner", context.weekId)}
            weekId={context.weekId}
          />

          <article className="plan-command-week">
            <span>Ausgewaehlte Woche</span>
            <strong>KW {context.calendarWeek}</strong>
            <p>{getWeekDateRange(context, { withYear: true })}</p>
          </article>
        </section>

        <section className="section-block command-section-block">
          <div className="section-heading">
            <p className="eyebrow">Planungsparameter</p>
            <h2>Deine Vorgaben</h2>
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

      </div>
      <AppBottomNav active="plan" weekId={context.weekId} />
    </main>
  );
}
