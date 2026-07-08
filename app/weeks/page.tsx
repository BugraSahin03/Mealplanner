import Link from "next/link";

import { getDb } from "@/src/db/client";
import {
  buildWeekHref,
  buildWeekSummaries,
  getWeekDateRange,
  getWeekLabel,
  resolveWeekIdFromParam,
  type WeekSummary,
} from "@/src/week-context/weeks";

export const dynamic = "force-dynamic";

type WeeksPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type YearGroup = {
  year: number;
  weeks: WeekSummary[];
};

function groupWeeksByYear(weeks: WeekSummary[]): YearGroup[] {
  const groups = new Map<number, WeekSummary[]>();

  for (const week of weeks) {
    const year = week.context.calendarYear ?? new Date().getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), week]);
  }

  return Array.from(groups.entries())
    .map(([year, yearWeeks]) => ({
      year,
      weeks: yearWeeks.sort((left, right) => (left.context.calendarWeek ?? 0) - (right.context.calendarWeek ?? 0)),
    }))
    .sort((left, right) => right.year - left.year);
}

function WeekRow({ summary, selectedWeekId }: { summary: WeekSummary; selectedWeekId: string | null }) {
  const isSelected = summary.context.weekId === selectedWeekId;

  return (
    <Link className={isSelected ? "week-list-row week-list-row-active" : "week-list-row"} href={buildWeekHref("/week", summary.context.weekId)}>
      <span>KW {summary.context.calendarWeek}</span>
      <strong>{getWeekDateRange(summary.context)}</strong>
    </Link>
  );
}

export default async function WeeksPage({ searchParams }: WeeksPageProps) {
  const params = await searchParams;
  const selectedWeekId = resolveWeekIdFromParam(params?.week);
  const weeks = buildWeekSummaries(getDb());
  const grouped = groupWeeksByYear(weeks);
  const current = weeks.find((week) => week.bucket === "current") ?? weeks[0];

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
          <Link className="nav-link nav-link-active" href="/weeks">
            Wochen
          </Link>
          <Link className="nav-link" href={current ? buildWeekHref("/planner", current.context.weekId) : "/planner"}>
            Wochenplan
          </Link>
          <Link className="nav-link" href={current ? buildWeekHref("/planner", current.context.weekId, "#einkauf") : "/planner#einkauf"}>
            Einkaufsliste
          </Link>
        </nav>
      </aside>

      <div className="content weeks-content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Wochenverwaltung</p>
            <h1>Wochen gezielt vorbereiten.</h1>
            {current ? (
              <p className="section-copy">Aktuelle Kalenderwoche: {getWeekLabel(current.context, { withYear: true })}</p>
            ) : null}
          </div>
          <div className="status-pill">
            <span>{weeks.length}</span>
            <small>Wochen</small>
          </div>
        </header>

        <section className="section-block week-section">
          <div className="section-heading">
            <p className="eyebrow">Jahresübersicht</p>
            <h2>Kalenderwochen</h2>
          </div>

          <div className="week-year-list">
            {grouped.map((group) => (
              <details className="week-year-group" key={group.year} open={group.year === current?.context.calendarYear}>
                <summary>
                  <span>{group.year}</span>
                  <small>{group.weeks.length} Wochen</small>
                </summary>
                <div className="week-list">
                  {group.weeks.map((summary) => (
                    <WeekRow key={summary.context.weekId} selectedWeekId={selectedWeekId} summary={summary} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
