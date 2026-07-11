import Link from "next/link";

import { getDb } from "@/src/db/client";
import { plannerJobStatusLabels } from "@/src/planner/job-status-view";
import {
  getLatestPlannerJobForWeek,
  getLatestSuccessfulPlannerJobForWeek,
} from "@/src/planner/repository";
import { buildWeekPlanView } from "@/src/planner/week-plan-view";
import { weekdays, weekContextPeople } from "@/src/week-context/model";
import { getOrCreateCurrentWeekContext, getOrCreateWeekContextById } from "@/src/week-context/repository";
import { getWeekDateRange, resolveWeekIdFromParam } from "@/src/week-context/weeks";
import { WeekSwitcher } from "../week-switcher";
import { AppBottomNav } from "../app-bottom-nav";
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
  const latestStatus = latestJob?.status ?? "idle";
  const weekPlan = latestSuccessfulJob?.response
    ? buildWeekPlanView(latestSuccessfulJob.response)
    : null;

  return (
    <main className="planner-command-page bottom-nav-page">
      <div className="planner-command-content">
        <Link className="brand brand-link planner-brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Essenplanner</span>
        </Link>
        <header className="planner-command-header">
          <div>
            <p className="eyebrow">Deine Woche</p>
            <h1>KW {weekContext.calendarWeek}</h1>
            <p>{getWeekDateRange(weekContext, { withYear: true })}</p>
          </div>
          <div className={`planner-plan-state planner-plan-state-${latestStatus}`}>
            <span aria-hidden="true" />
            <p>{weekPlan ? "Plan vorhanden" : plannerJobStatusLabels[latestStatus]}</p>
          </div>
        </header>

        <WeekSwitcher basePath="/planner" context={weekContext} />

        <section className="planner-calendar-shell" id="plan">
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
      </div>
      <AppBottomNav active="planner" weekId={weekContext.weekId} />
    </main>
  );
}
