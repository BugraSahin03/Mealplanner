import Link from "next/link";

import { getDb } from "@/src/db/client";
import {
  buildWeekHref,
  buildWeekSummaries,
  getWeekDateRange,
  resolveWeekIdFromParam,
  type WeekSummary,
} from "@/src/week-context/weeks";
import { AppBottomNav } from "../app-bottom-nav";

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
    <Link className={isSelected ? "week-list-row week-list-row-active" : "week-list-row"} href={buildWeekHref("/planner", summary.context.weekId)}>
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
    <main className="weeks-command-page bottom-nav-page">
      <div className="weeks-command-content">
        <Link className="brand brand-link" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Essenplanner</span>
        </Link>
        <header className="weeks-command-header">
          <div>
            <p className="eyebrow">Wochen</p>
            <h1>Deine Wochen.</h1>
          </div>
        </header>

        <section className="weeks-command-list week-section">
          <div className="weeks-command-list-heading">
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
      <AppBottomNav active="planner" weekId={current?.context.weekId} />
    </main>
  );
}
