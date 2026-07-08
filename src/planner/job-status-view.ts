import type { PlannerJob } from "./repository";

export const plannerJobStatusLabels: Record<PlannerJob["status"] | "idle", string> = {
  idle: "Bereit",
  running: "Laeuft",
  success: "Fertig",
  failed: "Fehler",
};

export const plannerJobStatusDescriptions: Record<PlannerJob["status"] | "idle", string> = {
  idle: "Noch kein aktiver Planner-Auftrag fuer diese Woche.",
  running: "Die Wochenplanung wird verarbeitet.",
  success: "Der Planner-Response wurde validiert und gespeichert.",
  failed: "Der Auftrag ist fehlgeschlagen. Fehlerdetails sind gespeichert.",
};

export function formatPlannerTimestamp(value: string | null): string {
  if (!value) {
    return "Noch nicht gesetzt";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(`${value.replace(" ", "T")}Z`));
}

export function readPlannerResponseTitle(job: PlannerJob | null): string {
  const response = job?.response;
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return "Noch kein validierter Plan gespeichert.";
  }

  const plan = (response as { plan?: unknown }).plan;
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return "Noch kein validierter Plan gespeichert.";
  }

  return (plan as { title?: string }).title ?? "Validierter Plan gespeichert.";
}

export function readConfiguredPlannerAdapter(): string {
  return process.env.ESSENPLANNER_PLANNER_ADAPTER === "openclaw-cli"
    ? "OpenClaw CLI"
    : "Fixture";
}
