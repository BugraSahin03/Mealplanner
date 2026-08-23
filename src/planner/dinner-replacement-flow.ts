import type { SqliteDatabase } from "../db/sqlite";
import { createDinnerReplacementAdapterFromEnv, type DinnerReplacementAdapter } from "./dinner-replacement-adapter";
import {
  assertDinnerReplacement,
  buildDinnerReplacementRequest,
  mergeDinnerReplacement,
} from "./dinner-replacement";
import { getLatestSuccessfulPlannerJobForWeek, replaceSuccessfulPlannerJobResponse, type PlannerJob } from "./repository";
import { assertPlannerResponse } from "./response";
import type { PlannerRequest } from "./request";

export async function replaceDinnerPairForWeek(
  db: SqliteDatabase,
  weekId: string,
  leftoverGroupId: string,
  adapter: DinnerReplacementAdapter = createDinnerReplacementAdapterFromEnv(),
): Promise<PlannerJob> {
  const job = getLatestSuccessfulPlannerJobForWeek(db, weekId);
  if (!job?.response) {
    throw new Error("Für diese Woche gibt es noch keinen fertigen Plan.");
  }

  const current = assertPlannerResponse(job.response);
  const request = buildDinnerReplacementRequest(
    job.request as PlannerRequest,
    current,
    leftoverGroupId,
  );
  const replacement = await adapter.replaceDinner(request);
  assertDinnerReplacement(replacement, request);
  const updated = mergeDinnerReplacement(current, replacement);
  assertPlannerResponse(updated);

  return replaceSuccessfulPlannerJobResponse(db, job.jobId, updated);
}
