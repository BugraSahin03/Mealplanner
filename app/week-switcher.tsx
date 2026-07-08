import Link from "next/link";

import type { WeekContext } from "@/src/planner/repository";
import { buildWeekHref, buildWeekSwitcherState, getWeekLabel } from "@/src/week-context/weeks";

type WeekSwitcherProps = {
  basePath: string;
  context: WeekContext;
};

export function WeekSwitcher({ basePath, context }: WeekSwitcherProps) {
  const switcher = buildWeekSwitcherState(context);

  return (
    <nav className="week-switcher" aria-label="Kalenderwoche wechseln">
      <Link className="week-switcher-button" href={buildWeekHref(basePath, switcher.previous.weekId)}>
        <span aria-hidden="true">‹</span>
        <strong>KW {switcher.previous.calendarWeek}</strong>
      </Link>
      <Link className="week-switcher-current" href={buildWeekHref("/weeks", switcher.current.weekId)}>
        <span>Aktive Woche</span>
        <strong>{getWeekLabel(switcher.current, { withYear: true })}</strong>
      </Link>
      <Link className="week-switcher-button" href={buildWeekHref(basePath, switcher.next.weekId)}>
        <strong>KW {switcher.next.calendarWeek}</strong>
        <span aria-hidden="true">›</span>
      </Link>
    </nav>
  );
}
