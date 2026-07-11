import type { PlannerJob, PlannerJobStatus } from "@/src/planner/repository";

export type PlannerStatusSnapshot = {
  jobId: string | null;
  status: PlannerJobStatus;
  errorMessage: string | null;
  updatedAt: string | null;
  hasPlan: boolean;
};

export function presentPlannerError(job: PlannerJob | null): string | null {
  if (!job?.errorMessage) {
    return null;
  }

  if (job.errorMessage.includes("Invalid planner response")) {
    return "OpenClaw hat keinen gültigen Wochenplan geliefert. Bitte versuche es erneut.";
  }

  if (job.errorMessage.toLowerCase().includes("timed out")) {
    return "Die Planung hat zu lange gedauert. Bitte versuche es erneut.";
  }

  return "OpenClaw konnte den Wochenplan nicht erstellen. Bitte versuche es erneut.";
}
