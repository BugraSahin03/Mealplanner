import Link from "next/link";

import { getDb } from "@/src/db/client";
import { getLatestSuccessfulPlannerJobForWeek } from "@/src/planner/repository";
import { buildWeekPlanView } from "@/src/planner/week-plan-view";
import { getOrCreateCurrentWeekContext, getOrCreateWeekContextById } from "@/src/week-context/repository";
import { buildWeekHref, resolveWeekIdFromParam } from "@/src/week-context/weeks";
import { WeekSwitcher } from "../week-switcher";
import { ShoppingList } from "../planner/shopping-list";
import { AppBottomNav } from "../app-bottom-nav";

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
    <main className="command-app-shell bottom-nav-page">
      <div className="content command-content">
        <Link className="brand brand-link command-page-brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Essenplanner</span>
        </Link>
        <header className="command-page-header">
          <div>
            <p className="eyebrow">KW {context.calendarWeek}</p>
            <h1>Einkaufen.</h1>
          </div>
        </header>

        <WeekSwitcher basePath="/shopping-list" context={context} />

        {weekPlan ? (
          <section className="section-block command-section-block shopping-list-section">
            <ShoppingList groups={weekPlan.shoppingGroups} />
          </section>
        ) : (
          <section className="section-block command-section-block plan-empty-state">
            <div className="section-heading">
              <h2>Noch keine Liste.</h2>
            </div>
            <Link className="primary-button command-primary-button" href={buildWeekHref("/plan", context.weekId)}>
              Plan erstellen
            </Link>
          </section>
        )}
      </div>
      <AppBottomNav active="shopping" weekId={context.weekId} />
    </main>
  );
}
