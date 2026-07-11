import { redirect } from "next/navigation";

import { buildWeekHref, resolveWeekIdFromParam } from "@/src/week-context/weeks";

type LegacyWeekPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyWeekPage({ searchParams }: LegacyWeekPageProps) {
  const params = await searchParams;
  const selectedWeekId = resolveWeekIdFromParam(params?.week);

  redirect(selectedWeekId ? buildWeekHref("/planner", selectedWeekId) : "/planner");
}
