import Link from "next/link";

import { createAndRunPlannerJobForWeekAction } from "@/app/plan/actions";
import { getDb } from "@/src/db/client";
import {
  formatPlannerTimestamp,
  plannerJobStatusLabels,
  readConfiguredPlannerAdapter,
} from "@/src/planner/job-status-view";
import {
  getLatestPlannerJobForWeek,
  getLatestSuccessfulPlannerJobForWeek,
  type PlannerJob,
} from "@/src/planner/repository";
import { buildWeekIdFromDate, getIsoWeekStart } from "@/src/week-context/model";
import { getOrCreateWeekContextById } from "@/src/week-context/repository";
import {
  buildWeekHref,
  buildWeekSwitcherState,
  getWeekDateRange,
  resolveWeekIdFromParam,
} from "@/src/week-context/weeks";
import { AppBottomNav } from "./app-bottom-nav";

export const dynamic = "force-dynamic";

function hasShoppingList(job: PlannerJob | null): boolean {
  if (!job?.response || typeof job.response !== "object" || Array.isArray(job.response)) {
    return false;
  }

  const shoppingList = (job.response as { shoppingList?: unknown }).shoppingList;
  return Array.isArray(shoppingList) && shoppingList.length > 0;
}

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const db = getDb();
  const currentWeekId = buildWeekIdFromDate(getIsoWeekStart());
  const selectedWeekId = resolveWeekIdFromParam(params?.week);
  const context = getOrCreateWeekContextById(db, selectedWeekId ?? currentWeekId);
  const switcher = buildWeekSwitcherState(context);
  const latestJob = getLatestPlannerJobForWeek(db, context.weekId);
  const latestSuccessfulJob = getLatestSuccessfulPlannerJobForWeek(db, context.weekId);
  const hasPlan = latestSuccessfulJob !== null;
  const shoppingReady = hasShoppingList(latestSuccessfulJob);
  const latestStatus = latestJob?.status ?? "idle";
  const isRunning = latestStatus === "running";

  const focus = isRunning
    ? {
        eyebrow: "Wird gerade erledigt",
        title: "Dein Wochenplan entsteht.",
        copy: "Du musst nichts weiter tun. Den aktuellen Stand findest du im Wochenplan.",
        label: "Status ansehen",
        href: buildWeekHref("/planner", context.weekId),
      }
    : hasPlan
      ? {
          eyebrow: "Alles vorbereitet",
          title: shoppingReady ? "Du kannst einkaufen." : "Dein Wochenplan ist fertig.",
          copy: shoppingReady
            ? "Die Einkaufsliste für diese Woche wartet auf dich."
            : "Der Plan für diese Woche ist bereit.",
          label: shoppingReady ? "Einkaufsliste öffnen" : "Wochenplan öffnen",
          href: buildWeekHref(shoppingReady ? "/shopping-list" : "/planner", context.weekId),
        }
      : {
          eyebrow: "Ein Klick für diese Woche",
          title: "Lass deine Woche planen.",
          copy: "Homeoffice und Essenswünsche werden automatisch berücksichtigt.",
          label: "Wochenplan erstellen",
          href: null,
        };

  return (
    <main className="start-page bottom-nav-page">
      <header className="start-header">
        <Link className="brand brand-link" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Essenplanner</span>
        </Link>
        <div className="start-week">
          <Link aria-label={`Zu KW ${switcher.previous.calendarWeek}`} href={buildWeekHref("/", switcher.previous.weekId)}>
            ‹
          </Link>
          <div>
            <strong>KW {context.calendarWeek}</strong>
            <span>{getWeekDateRange(context, { withYear: true })}</span>
          </div>
          <Link aria-label={`Zu KW ${switcher.next.calendarWeek}`} href={buildWeekHref("/", switcher.next.weekId)}>
            ›
          </Link>
        </div>
      </header>

      <section className="start-focus" aria-labelledby="start-title">
        <div className="start-focus-copy">
          <p className="eyebrow">{focus.eyebrow}</p>
          <h1 id="start-title">{focus.title}</h1>
          <p>{focus.copy}</p>
        </div>

        {focus.href ? (
          <Link className="start-primary-action" href={focus.href}>
            <span>{focus.label}</span>
            <b aria-hidden="true">→</b>
          </Link>
        ) : (
          <form action={createAndRunPlannerJobForWeekAction}>
            <input type="hidden" name="weekId" value={context.weekId} />
            <button className="start-primary-action" type="submit">
              <span>{focus.label}</span>
              <b aria-hidden="true">→</b>
            </button>
          </form>
        )}
      </section>

      <footer className="start-footer start-runtime-footer">
        <p>
          <span className={`start-status-dot start-status-${latestStatus}`} aria-hidden="true" />
          Planner {plannerJobStatusLabels[latestStatus]} · {readConfiguredPlannerAdapter()}
          {latestJob?.updatedAt ? ` · ${formatPlannerTimestamp(latestJob.updatedAt)}` : ""}
        </p>
      </footer>
      <AppBottomNav active="home" weekId={context.weekId} />
    </main>
  );
}
