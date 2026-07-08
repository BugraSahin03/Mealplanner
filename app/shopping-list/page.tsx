import Link from "next/link";

import { getDb } from "@/src/db/client";
import { getLatestSuccessfulPlannerJobForWeek } from "@/src/planner/repository";
import { buildWeekPlanView } from "@/src/planner/week-plan-view";
import { getOrCreateCurrentWeekContext, getOrCreateWeekContextById } from "@/src/week-context/repository";
import { buildWeekHref, getWeekLabel, resolveWeekIdFromParam } from "@/src/week-context/weeks";
import { WeekSwitcher } from "../week-switcher";
import { ShoppingList } from "../planner/shopping-list";

export const dynamic = "force-dynamic";

type ShoppingListPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShoppingListPage({ searchParams }: ShoppingListPageProps) {
  const params = await searchParams;
  const db = getDb();
  const selectedWeekId = resolveWeekIdFromParam(params?.week);
  const context = selectedWeekId
    ? getOrCreateWeekContextById(db, selectedWeekId)
    : getOrCreateCurrentWeekContext(db);
  const latestSuccessfulJob = getLatestSuccessfulPlannerJobForWeek(db, context.weekId);
  const weekPlan = latestSuccessfulJob?.response
    ? buildWeekPlanView(latestSuccessfulJob.response)
    : null;

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
          <Link className="nav-link" href={buildWeekHref("/plan", context.weekId)}>
            Plan erstellen
          </Link>
          <Link className="nav-link" href={buildWeekHref("/planner", context.weekId)}>
            Wochenplan
          </Link>
          <Link className="nav-link nav-link-active" href={buildWeekHref("/shopping-list", context.weekId)}>
            Einkaufsliste
          </Link>
        </nav>
      </aside>

      <div className="content command-content">
        <header className="command-page-header">
          <div>
            <p className="eyebrow">Einkaufsliste · KW {context.calendarWeek}</p>
            <h1>Einkauf fuer diese Woche.</h1>
            <p className="section-copy">Du siehst die Einkaufsliste fuer {getWeekLabel(context, { withYear: true })}.</p>
          </div>
          <div className="status-pill">
            <span>{weekPlan?.shoppingGroups.length ?? 0}</span>
            <small>Gruppen</small>
          </div>
        </header>

        <WeekSwitcher basePath="/shopping-list" context={context} />

        {weekPlan ? (
          <section className="section-block command-section-block shopping-list-section">
            <div className="section-heading">
              <p className="eyebrow">Gruppiert fuer den Wocheneinkauf</p>
              <h2>{weekPlan.title}</h2>
            </div>
            <ShoppingList groups={weekPlan.shoppingGroups} />
          </section>
        ) : (
          <section className="section-block command-section-block plan-empty-state">
            <div className="section-heading">
              <p className="eyebrow">Noch keine Liste</p>
              <h2>Fuer diese KW gibt es noch keine Einkaufsliste.</h2>
            </div>
            <p className="section-copy">
              Starte zuerst den Planungsauftrag fuer diese Kalenderwoche. Danach wird die passende Einkaufsliste hier angezeigt.
            </p>
            <Link className="primary-button command-primary-button" href={buildWeekHref("/plan", context.weekId)}>
              Plan erstellen
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
